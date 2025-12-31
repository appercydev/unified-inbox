import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'

// Inngest API route for Next.js App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Your functions will be registered here
  ],
})
