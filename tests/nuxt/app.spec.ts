import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import app from '~/app.vue'

describe('app', () => {
  it('app can be mounted', async () => {
    const component = await mountSuspended(app, { route: '/' })
    expect(component).toBeTruthy()
  })
  it('app has Better Twitch Clips Browser text', async () => {
    const component = await mountSuspended(app, { route: '/' })
    expect(component.html()).toContain('Better Twitch Clips Browser')
  })
})
