import { PrismaClient } from '@prisma/client'

const METHODS = {
  POST: 'POST'
}

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const users = await prisma.user.findMany();


  if(req.method === METHODS.POST) {
    res.status(200).json({ ok: 'ok'})
  } else {
    res.status(200).json(users)
  }
}
