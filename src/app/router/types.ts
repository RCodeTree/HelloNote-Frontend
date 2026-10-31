import 'vue-router'

// 扩展路由元信息类型，使 meta.title / meta.requiresAuth 在全项目获得类型提示。
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    layout?: 'default' | 'blank'
  }
}
