function injectCancelPageBtn() {
    var ids = Array.prototype.map.call(document.querySelectorAll('#acWrContents table')[4].querySelectorAll('tr'), (row) => {
        return row.querySelector('td').textContent;
    });
    ids.shift(); // 先頭行は「商品ID」
    if (ids.length == 0) {
        return;
    }

    var title = document.getElementsByClassName('libTitleH1')[0];
    var btn = document.createElement('BUTTON');
    btn.type = 'BUTTON';
    btn.classList.add('yabp-btn');
    btn.innerText = '表示中の商品の出品を一括で取り下げる';
    btn.addEventListener('click', () => {
        window.location.href = `https://page.auctions.yahoo.co.jp/jp/show/cancelauction?aID=${ids[0]}&yabpIds=${ids.join(',')}`;
    });
    title.appendChild(btn);
}

function injectCancelBtn() {
    var ids = null;
    window.location.search.substring(1).split('&').forEach((query) => {
        if (query.startsWith('yabpIds=')) {
            ids = query.substr(8).split(',');
        }
    });
    if (!ids) {
        return;
    }

    var form = document.querySelector('form');
    var btn = document.createElement('BUTTON');
    btn.type = 'BUTTON';
    btn.classList.add('yabp-btn');
    btn.innerText = '一括で取り消す';
    btn.addEventListener('click', () => {
        btn.disabled = true;
        var params = new URLSearchParams();
        params.set('crumb', form.crumb.value);
        params.set('cancel_fee', form.cancel_fee.value);
        params.set('confirm', form.confirm.value);
        ids.forEach((id) => {
            params.set('aID', id);
            fetch('https://page.auctions.yahoo.co.jp/jp/config/cancelauction', {
                'method': 'POST',
                'body': params,
                'credentials': 'include'
            }).then((resp) => {
                window.setTimeout(() => {
                    window.location.href = 'https://auctions.yahoo.co.jp/openuser/jp/show/mystatus?select=selling';
                }, 3000);
            });
        });
    });
    form.appendChild(btn);
}

if (window.location.href === 'https://auctions.yahoo.co.jp/openuser/jp/show/mystatus?select=selling') {
    // 出品中一覧画面
    injectCancelPageBtn();
} else if (window.location.href.startsWith('https://page.auctions.yahoo.co.jp/jp/show/cancelauction?')) {
    // 出品キャンセル画面
    injectCancelBtn();
}