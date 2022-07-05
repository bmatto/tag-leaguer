import { PrismaClient } from '@prisma/client'
import { gql, ApolloServer } from 'apollo-server-micro';

const prisma = new PrismaClient()

const typeDefs = gql`
  type Score {
    id: Int
    strokes: Int
    date: String
  }

  type User {
    id: Int
    firstname: String
    lastname: String
    email: String
    scores: [Score!]
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
  }
`

const resolvers = {
  Query: {
    users: async (parent, args, context, info) => {
      const users = await prisma.user.findMany();

      return users
    },
    user: async (parent, args) => {
      const user = await prisma.user.findUnique({
        where: {
          id: args.id
        }
      })

      return user
    }
  },
  User: {
    async scores(parent) {
      const scores = prisma.score.findMany({
        where: {
          userId: parent.id
        }
      })

      return scores
    }
  }
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers
})

const startServer = apolloServer.start();

export default async function handler(req, res) {
  await startServer;

  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
