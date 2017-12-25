function injectCancelPageBtn() {
    var table = document.querySelectorAll('#acWrContents table')[4];
    if (!table) {
        // 出品中の商品がない
        return;
    }
    var ids = Array.prototype.map.call(table.querySelectorAll('tr'), (row) => {
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
        Promise.all(ids.map((id) => {
            return fetch('https://page.auctions.yahoo.co.jp/jp/config/cancelauction', {
                'method': 'POST',
                'body': new URLSearchParams({
                    'crumb': form.crumb.value,
                    'cancel_fee': form.cancel_fee.value,
                    'confirm': form.confirm.value,
                    'aID': id
                }),
                'credentials': 'include'
            });
        })).then((resps) => {
            // POSTしてから画面に反映されるまで少し時間がかかるので待つ
            window.setTimeout(() => {
                window.location.href = 'https://auctions.yahoo.co.jp/openuser/jp/show/mystatus?select=selling';
            }, 3000);
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