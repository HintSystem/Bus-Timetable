let routes = []

if (process.env.APP_TYPE === 'tracker') {
  routes = [{
    path: '/',
    component: () => import('layouts/dev/TrackerLayout.vue'),
    children: [{ path: '', component: () => import('pages/dev/TrackingPage.vue') }]
  }]
} else {
  routes = [{
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }]
  }]
}

// Dev only routes, may also need authorization in the future
if (process.env.DEV) {
  routes.push({
    path: '/dev',
    component: () => import('layouts/dev/DevLayout.vue'),
    children: [
      {
        name: 'Database',
        path: '',
        component: () => import('pages/dev/DatabasePage.vue')
      },
      {
        name: 'Tracking',
        path: 'track',
        component: () => import('pages/dev/TrackingPage.vue')
      }
    ]
  })
}

// Redirect to error page
routes.push({
  path: '/:catchAll(.*)*',
  component: () => import('pages/ErrorNotFound.vue')
})

export default routes
