const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }]
  }
]

// DEV only routes
const devRoute = {
  path: '/dev',
  component: () => import('layouts/dev/DevLayout.vue'),
  children: [
    {
      name: 'Database',
      path: '',
      component: () => import('pages/dev/DatabasePage.vue')
    }
  ]
}
if (process.env.DEV) {
  routes.push(devRoute)
}

// Always leave this as last one,
// but you can also remove it
routes.push({
  path: '/:catchAll(.*)*',
  component: () => import('pages/ErrorNotFound.vue')
})

export default routes
