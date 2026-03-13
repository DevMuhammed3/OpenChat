import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const zones = await prisma.chat.findMany({
    where: {
      type: 'ZONE',
      channels: {
        none: {}
      }
    }
  })

  console.log(`Found ${zones.length} zones without channels.`)

  for (const zone of zones) {
    await prisma.channel.create({
      data: {
        publicId: crypto.randomUUID(),
        name: 'general',
        type: 'TEXT',
        chatId: zone.id
      }
    })
    console.log(`Created 'general' channel for zone: ${zone.name}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
