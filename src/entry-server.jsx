// Entry cho bước prerender (vite build --ssr, gọi từ scripts/prerender.mjs) — không vào bundle client.
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { SOURCES } from './components/PebMemberSection.jsx'
import { translations } from './i18n/translations'
import ROUTES from './routes.json'

export { ROUTES, SOURCES, translations }

export function render(tab, postLists) {
  return renderToString(<App initialTab={tab} initialPostLists={postLists} />)
}
