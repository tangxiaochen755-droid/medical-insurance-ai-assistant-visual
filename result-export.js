(() => {
  const PAGE_SIZE = 50;
  const RULE_VERSION = 'V0.2';
  let resultContext = null;
  let listState = { page: 1, total: 0, labels: [] };
  let exportTimer = null;

  const svgDownload = '<svg class="btn-icon" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>';
  const svgList = '<svg class="btn-icon" viewBox="0 0 24 24"><path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>';
  const nowText = () => new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(new Date()).replaceAll('/', '-');
  const tagHtml = names => names.map(name => `<span class="tag">${escapeHtml(name)}</span>`).join('');

  function ensureLayer() {
    let layer = document.querySelector('#dataDialogLayer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'dataDialogLayer';
    layer.className = 'data-dialog-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    layer.addEventListener('click', event => { if (event.target === layer) closeDialog(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && layer.classList.contains('open')) closeDialog(); });
    return layer;
  }

  function openLayer(html) {
    const layer = ensureLayer();
    layer.innerHTML = html;
    layer.classList.add('open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dialog-open');
    layer.querySelectorAll('[data-close-dialog]').forEach(button => button.onclick = closeDialog);
    return layer;
  }

  function closeDialog() {
    const layer = document.querySelector('#dataDialogLayer');
    if (!layer) return;
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('dialog-open');
    clearTimeout(exportTimer);
  }

  function mockPerson(index) {
    const templates = [
      [1,2,4,5,6,7], [1,2,3,5,6,7], [2,3,4,5,6,7], [1,2,4,5,7], [2,4,5,6,7], [1,3,4,5,6,7]
    ];
    const ids = templates[index % templates.length];
    return {
      no: index + 1,
      code: `JS-2026-${String(100000 - index).padStart(6, '0')}`,
      names: ids.map(id => features.find(feature => feature.id === id).name)
    };
  }

  function renderListRows() {
    const tbody = document.querySelector('#allDataRows');
    if (!tbody) return;
    const start = (listState.page - 1) * PAGE_SIZE;
    const length = Math.min(PAGE_SIZE, listState.total - start);
    tbody.innerHTML = Array.from({ length }, (_, offset) => mockPerson(start + offset)).map(row => `
      <tr>
        <td>${row.no}</td>
        <td><strong class="person-code">${row.code}</strong></td>
        <td><span class="hit">${row.names.length} 条</span></td>
        <td><div class="condition-tags">${tagHtml(row.names)}</div></td>
      </tr>`).join('');
    const pages = Math.max(1, Math.ceil(listState.total / PAGE_SIZE));
    document.querySelector('#pageIndex').textContent = `第 ${listState.page} / ${pages} 页`;
    document.querySelector('#pageRange').textContent = `当前显示 ${start + 1}–${start + length} 条，共 ${listState.total.toLocaleString()} 条`;
    const previous = document.querySelector('#pagePrevious');
    const next = document.querySelector('#pageNext');
    previous.disabled = listState.page <= 1;
    next.disabled = listState.page >= pages;
  }

  function openAllList() {
    if (!resultContext) return;
    listState = { page: 1, total: resultContext.count, labels: resultContext.labels };
    const layer = openLayer(`
      <section class="data-dialog" role="dialog" aria-modal="true" aria-labelledby="allListTitle">
        <header class="data-dialog-head">
          <div class="data-dialog-title"><strong id="allListTitle">全部目标人员名单</strong><span>${escapeHtml(resultContext.modeName)} · 模拟服务端分页</span></div>
          <button class="dialog-close" data-close-dialog aria-label="关闭">×</button>
        </header>
        <div class="data-dialog-summary">
          <div class="condition-tags">${tagHtml(resultContext.labels)}</div>
          <span class="server-page-note">共 <b>${resultContext.count.toLocaleString()}</b> 条 · 服务端分页 · 每页50条</span>
        </div>
        <div class="all-data-table-wrap">
          <table class="all-data-table">
            <thead><tr><th>序号</th><th>人员编号</th><th>符合特征数</th><th>符合的人员特征</th></tr></thead>
            <tbody id="allDataRows"></tbody>
          </table>
        </div>
        <footer class="data-dialog-foot">
          <span class="page-summary" id="pageRange"></span>
          <div class="pagination">
            <select class="page-size" aria-label="每页条数" disabled><option>50 条/页</option></select>
            <button class="btn" id="pagePrevious">上一页</button>
            <span class="page-index" id="pageIndex"></span>
            <button class="btn" id="pageNext">下一页</button>
          </div>
        </footer>
      </section>`);
    layer.querySelector('#pagePrevious').onclick = () => { if (listState.page > 1) { listState.page--; renderListRows(); } };
    layer.querySelector('#pageNext').onclick = () => { const pages = Math.ceil(listState.total / PAGE_SIZE); if (listState.page < pages) { listState.page++; renderListRows(); } };
    renderListRows();
  }

  function exportCurrentPage() {
    if (!resultContext) return;
    toast(`已模拟导出当前页 XLSX（第1页，共${Math.min(PAGE_SIZE, resultContext.count)}条）`);
  }

  function openExportTask() {
    if (!resultContext) return;
    const createdAt = nowText();
    const taskId = `EXP-${Date.now().toString().slice(-10)}`;
    const layer = openLayer(`
      <section class="data-dialog export-dialog" role="dialog" aria-modal="true" aria-labelledby="exportTitle">
        <header class="data-dialog-head">
          <div class="data-dialog-title"><strong id="exportTitle">导出全部筛查结果</strong><span>后台异步生成 XLSX · 前端流程演示</span></div>
          <button class="dialog-close" data-close-dialog aria-label="关闭">×</button>
        </header>
        <div class="export-content">
          <div class="export-status" id="exportStatus"><span class="export-spinner"></span><span><strong>正在创建导出文件</strong><span>共 ${resultContext.count.toLocaleString()} 条数据，请稍候…</span></span></div>
          <div class="export-meta">
            <div class="export-meta-item"><span>导出任务编号</span><b>${taskId}</b></div>
            <div class="export-meta-item"><span>文件格式</span><b>XLSX</b></div>
            <div class="export-meta-item"><span>筛查条件</span><b>${escapeHtml(resultContext.labels.join('；'))}</b></div>
            <div class="export-meta-item"><span>规则版本</span><b>${RULE_VERSION}</b></div>
            <div class="export-meta-item"><span>生成时间</span><b>${createdAt}</b></div>
            <div class="export-meta-item"><span>操作人员</span><b>当前演示用户</b></div>
          </div>
          <div class="export-log"><h4>操作记录</h4><div id="exportLogs"><div class="export-log-row"><span>${createdAt}</span><b>任务已创建</b><span>提交全部结果导出请求</span></div><div class="export-log-row"><span>${createdAt}</span><b>文件生成中</b><span>正在按当前筛查条件整理数据</span></div></div></div>
        </div>
        <footer class="data-dialog-foot"><button class="btn" data-close-dialog>关闭</button><button class="btn primary" id="downloadExport" disabled>${svgDownload}下载 XLSX</button></footer>
      </section>`);
    const download = layer.querySelector('#downloadExport');
    exportTimer = setTimeout(() => {
      const status = layer.querySelector('#exportStatus');
      if (!status) return;
      status.classList.add('complete');
      status.querySelector('strong').textContent = '导出文件已生成';
      status.querySelector('strong + span').textContent = `已完成 ${resultContext.count.toLocaleString()} 条数据整理，可下载 XLSX 文件。`;
      layer.querySelector('#exportLogs').insertAdjacentHTML('beforeend', `<div class="export-log-row"><span>${nowText()}</span><b>生成完成</b><span>文件已进入可下载状态</span></div>`);
      download.disabled = false;
    }, 1100);
    download.onclick = () => toast('已模拟下载完整 XLSX 文件');
  }

  const originalShowResults = showResults;
  showResults = function (mode, labels) {
    const singleCounts = { 1:5680, 2:6240, 3:5122, 4:5794, 5:6855, 6:6258, 7:6988 };
    const count = mode === 'single' ? singleCounts[state.singleRisk] : mode === 'quick' ? (state.plan === 'compound' ? 6842 : 5276) : 6138;
    const coreIds = ['2','4','5','6','7'];
    const displayPeople = mode === 'single' ? people.filter(person => person[2].split(',').includes(String(state.singleRisk))) : mode === 'quick' && state.plan === 'core' ? people.filter(person => coreIds.every(id => person[2].split(',').includes(id))) : people;
    const modeName = mode === 'single' ? '单一风险筛查' : mode === 'quick' ? '组合风险筛查' : '自定义模式';
    resultContext = { mode, labels, count, modeName };
    assistantMessage(`<p>已完成模拟检索。当前条件共匹配到 <strong>${count.toLocaleString()}</strong> 名模拟人员，页面展示部分结果，可查看全部名单或导出表格。</p><div class="reply-card"><div class="reply-card-head"><strong>模拟目标人群</strong><span>${modeName} · 仅供演示</span></div><div class="reply-card-body"><div class="condition-box"><b>本次检索条件</b><div class="condition-tags">${tagHtml(labels)}</div></div><div class="result-tools"><div class="result-count"><b>${count.toLocaleString()}</b><span>名模拟人员</span></div><div class="result-tools-actions"><button class="btn ghost-primary" id="viewAllResults">${svgList}查看全部名单</button><button class="btn" id="exportCurrentPage">${svgDownload}导出当前页</button><button class="btn primary" id="exportAllResults">${svgDownload}导出全部结果</button></div></div><div class="result-list"><div class="result-columns"><span>人员编号</span><span>符合特征数</span><span>符合的人员特征</span></div>${displayPeople.map(person => `<div class="result-row"><strong class="person-code">${person[1]}</strong><span class="hit">${person[3]} 条</span><div class="condition-tags">${person[2].split(',').map(id => `<span class="tag">${features.find(feature => feature.id === Number(id)).name}</span>`).join('')}</div></div>`).join('')}</div><div class="notice">上述人员编号和结果均为虚构数据，不构成违法犯罪定性依据。</div><div class="action-row"><button class="btn" id="changeCondition">修改检索条件</button><button class="btn primary" id="searchAgain">再次检索</button></div></div></div>`);
    document.querySelector('#viewAllResults').onclick = openAllList;
    document.querySelector('#exportCurrentPage').onclick = exportCurrentPage;
    document.querySelector('#exportAllResults').onclick = openExportTask;
    document.querySelector('#changeCondition').onclick = () => mode === 'single' ? showRules(null, false) : mode === 'quick' ? showQuick(false) : showCustom(false);
    document.querySelector('#searchAgain').onclick = () => mode === 'single' ? runSingleRisk(state.singleRisk) : runSearch(mode);
  };
})();
