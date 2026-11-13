import 'vue-router'

// 扩展路由元信息类型，使 meta.title / meta.requiresAuth 在全项目获得类型提示。
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    layout?: 'default' | 'blank'
    /** 全幅页面（编辑器）：去掉内容区最大宽度与内边距，页面自管布局 */
    fullBleed?: boolean
    /** 宽内容区页面（面板三列）：保留内边距，仅放宽 max-width */
    wide?: boolean
  }
}
