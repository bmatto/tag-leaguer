import { PrismaClient } from '@prisma/client'
import { ApolloServer } from 'apollo-server-micro'

import typeDefs from '../../graphql/schema.graphql'

declare global {
  const prisma: PrismaClient | undefined
}

const prisma: PrismaClient = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

const resolvers = {
  Mutation: {
    deleteEvent: async (root, args) => {
      const { eventId } = args

      const deletedEvent = await prisma.event.delete({
        where: {
          id: parseInt(eventId),
        },
      })

      return deletedEvent
    },
    addEvent: async (root, args) => {
      const { input } = args

      const date = input.date ? new Date(input.date) : undefined

      const newEvent = await prisma.event.create({
        data: {
          ...input,
          ...(date ? { date } : {}),
        },
      })

      return newEvent
    },
    addUsersToEvent: async (root, args) => {
      const { input } = args

      const result = await prisma.eventsOnUsers.createMany({
        data: input.userIds.map((userId) => ({
          eventId: parseInt(input.eventId),
          userId: parseInt(userId),
        })),
      })

      return result
    },
    createNewUser: async (root, args) => {
      const {
        input: { eventId, email, ...newUser },
      } = args

      const data = {
        ...newUser,
      }

      if (email) {
        data.email = email
      }

      if (eventId) {
        data.events = {
          create: [
            {
              Event: {
                connect: {
                  id: parseInt(eventId),
                },
              },
            },
          ],
        }
      }

      const user = await prisma.user.create({
        data,
      })

      return user
    },
    removeUserFromEvent: async (root, args) => {
      const { userId, eventId } = args

      const result = await prisma.eventsOnUsers.delete({
        where: {
          userId_eventId: {
            userId: parseInt(userId),
            eventId: parseInt(eventId),
          },
        },
      })

      return Boolean(result)
    },
  },
  Query: {
    users: async () => {
      const users = await prisma.user.findMany()

      return users
    },
    user: async (_parent, args) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(args.userId),
        },
      })

      return user
    },
    searchUsers: async (_parent, args) => {
      const { term } = args

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstname: { contains: term, mode: 'insensitive' } },
            { lastname: { contains: term, mode: 'insensitive' } },
          ],
        },
      })

      return users
    },
    events: async () => {
      const events = await prisma.event.findMany()

      return events
    },
    event: async (_parent, args) => {
      const event = await prisma.event.findUnique({
        where: {
          id: parseInt(args.eventId),
        },
      })

      return event
    },
    courses: async () => {
      const courses = await prisma.course.findMany()

      return courses
    },
    course: async (_parent, args) => {
      const course = await prisma.course.findUnique({
        where: {
          id: parseInt(args.courseId),
        },
      })

      return course
    },
    scores: async () => {
      const scores = await prisma.score.findMany()

      return scores
    },
    tags: async () => {
      const tags = await prisma.tag.findMany()

      return tags
    },
    tag: async (_parent, args) => {
      const tag = await prisma.tag.findUnique({
        where: {
          id: parseInt(args.tagId),
        },
      })

      return tag
    },
  },
  Course: {
    async events(parent) {
      const events = await prisma.event.findMany({
        where: {
          courseId: parent.id,
        },
      })

      return events
    },
  },
  Event: {
    async course(parent) {
      const course = await prisma.course.findUnique({
        where: {
          id: parent.courseId,
        },
      })

      return course
    },
    async scores(parent) {
      const scores = await prisma.score.findMany({
        where: {
          eventId: parent.id,
        },
      })

      return scores
    },
    async users(parent) {
      const users = await prisma.user.findMany({
        where: {
          events: {
            some: {
              eventId: parent.id,
            },
          },
        },
      })

      // Provide users within an event the event id
      return users.map((user) => ({ ...user, event: parent }))
    },
  },
  User: {
    async lastEventTag(parent) {
      if (!parent.event) {
        throw new Error('Cannot get lastEventTag without event context')
      }

      const courseId = parent.event.courseId

      // Find the most recent tag for this user from an event on this course before todays event
      const tag = await prisma.score
        .findFirst({
          orderBy: {
            date: 'desc',
          },
          where: {
            userId: parent.id,
            Event: {
              courseId: courseId,
              date: {
                lt: parent.event.date,
              },
            },
          },
        })
        .tag()

      return tag
    },

    // bit of a hack to go event -> users -> eventScore
    async eventScore(parent) {
      if (!parent.event) {
        throw new Error('Cannot get event score without event context')
      }

      const { id: eventId } = parent.event

      const score = await prisma.score.findUnique({
        where: {
          userId_eventId: {
            userId: parent.id,
            eventId: eventId,
          },
        },
      })

      return score
    },
    async scores(parent) {
      const scores = await prisma.score.findMany({
        where: {
          userId: parent.id,
        },
      })

      return scores
    },
    async events(parent) {
      const events = await prisma.event.findMany({
        where: {
          users: {
            some: {
              userId: parent.id,
            },
          },
        },
      })

      return events
    },
  },
  Score: {
    async user(parent) {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      })

      return user
    },
    async event(parent) {
      const event = await prisma.event.findUnique({
        where: {
          id: parent.eventId,
        },
      })

      return event
    },
  },
  Tag: {
    async course(parent) {
      const course = await prisma.course.findUnique({
        where: {
          id: parent.courseId,
        },
      })

      return course
    },
  },
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
})

const startServer = apolloServer.start()

export default async function handler(req, res) {
  await startServer

  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
