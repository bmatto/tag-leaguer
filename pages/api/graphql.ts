import { PrismaClient } from '@prisma/client'
import { ApolloServer } from 'apollo-server-micro'

import typeDefs from '../../graphql/schema.graphql'

declare global {
  const prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

const resolvers = {
  Query: {
    users: async () => {
      const users = await prisma.user.findMany()

      return users
    },
    user: async (_parent, args) => {
      const user = await prisma.user.findUnique({
        where: {
          id: args.userId,
        },
      })

      return user
    },
    events: async () => {
      const events = await prisma.event.findMany()

      return events
    },
    event: async (_parent, args) => {
      const event = await prisma.event.findUnique({
        where: {
          id: args.eventId,
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
          id: args.courseId,
        },
      })

      return course
    },
    scores: async () => {
      const scores = await prisma.score.findMany()

      return scores
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
            every: {
              eventId: parent.id,
            },
          },
        },
      })

      // Provide users within an event the event id
      return users.map((user) => ({ ...user, eventId: parent.id }))
    },
  },
  User: {
    // bit of a hack to go event -> users -> eventScore
    async eventScore(parent) {
      if (!parent.eventId) {
        throw new Error('Cannot get event score without event context')
      }

      const score = await prisma.score.findUnique({
        where: {
          userId_eventId: {
            userId: parent.id,
            eventId: parent.eventId,
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
            every: {
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
