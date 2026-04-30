import 'dotenv/config'
import mongoose from 'mongoose'
import { ProductModel } from '../models/Product.model'

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!)
  const result = await ProductModel.findOneAndUpdate(
    { slug: 'wind-chaser-64' },
    {
      $set: {
        'name.zh': '追风者 64 桌面风洞',
        'description.zh': '专为 1:64 车模设计的桌面级风洞',
        'variants.0.name.zh': '曜石黑',
        'variants.1.name.zh': '皓月白',
      },
    },
    { new: true },
  )
  console.log('Updated:', result?.name)
  await mongoose.disconnect()
}

main().catch(console.error)
