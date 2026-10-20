import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Trang dựng sẵn (scripts/prerender.mjs) đã có HTML trong #root; createRoot thay nó bằng bản React
// (không hydrate vì theme/ngôn ngữ đã lưu của khách có thể khác bản dựng sẵn 'vi'/'light').
const data = window.__IVIDLAB_DATA__ || {};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App initialPostLists={data.postLists} />
  </React.StrictMode>,
)
