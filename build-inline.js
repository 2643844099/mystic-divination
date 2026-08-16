/* ============================================================
   构建脚本：将 css 与全部 js 内联进 index.html（幂等，可重复执行）
   用法：node build-inline.js
   维护方式：修改 css/ 或 js/ 下的源文件后重新运行本脚本
   ============================================================ */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlPath = path.join(dir, 'index.html');
const cssFile = fs.readFileSync(path.join(dir, 'css/style.css'), 'utf8');
const jsFile = ['js/data-tarot.js', 'js/data-svg.js', 'js/data-zodiac.js', 'js/data-lots.js', 'js/data-chart.js', 'js/app.js']
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
  .join('\n;\n');

if (/<\/script/i.test(jsFile) || /<\/style/i.test(cssFile)) {
  console.error('ABORT: 内容含 </script> 或 </style> 序列');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const CSS_EXT = /<link rel="stylesheet" href="css\/style\.css" \/>/;
const CSS_INLINE = /<style>[\s\S]*?<\/style>/;
const JS_EXT = /<script src="js\/data-tarot\.js"><\/script>\s*<script src="js\/data-svg\.js"><\/script>\s*<script src="js\/data-zodiac\.js"><\/script>\s*<script src="js\/data-lots\.js"><\/script>\s*<script src="js\/data-chart\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/;
const JS_INLINE = /<script>[\s\S]*?<\/script>/;

/* 注意：必须用函数替换，字符串替换会把 JS 中的 $$ 当作 $ 转义处理 */
if (CSS_EXT.test(html)) html = html.replace(CSS_EXT, () => '<style>\n' + cssFile + '\n</style>');
else if (CSS_INLINE.test(html)) html = html.replace(CSS_INLINE, () => '<style>\n' + cssFile + '\n</style>');
else { console.error('ABORT: 未找到 css 外链或内联块'); process.exit(1); }

if (JS_EXT.test(html)) html = html.replace(JS_EXT, () => '<script>\n' + jsFile + '\n</script>');
else if (JS_INLINE.test(html)) html = html.replace(JS_INLINE, () => '<script>\n' + jsFile + '\n</script>');
else { console.error('ABORT: 未找到 js 外链或内联块'); process.exit(1); }

fs.writeFileSync(htmlPath, html);
console.log('OK: index.html 已内联更新，大小', (html.length / 1024).toFixed(1), 'KB');
