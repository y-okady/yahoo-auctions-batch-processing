function injectCancelPageBtn() {
    var table = document.querySelectorAll('#acWrContents table[bgcolor="#dcdcdc"]')[0];
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
    let btnText = '一括で取り消す';
    btn.innerText = btnText;
    btn.addEventListener('click', () => {
        btn.disabled = true;
        var remaining = ids.length;
        btn.innerText = btnText + ` (残り${remaining}件)`;
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
            }).then(() => {
                btn.innerText = btnText + ` (残り${--remaining}件)`;
            });
        })).then(() => {
            // POSTしてから画面に反映されるまで少し時間がかかるので待つ
            btn.innerText = btnText + ' (しばらくお待ちください...)';
            window.setTimeout(() => {
                window.location.href = 'https://auctions.yahoo.co.jp/openuser/jp/show/mystatus?select=selling';
            }, 5000);
        });
    });
    form.appendChild(btn);
}

function reexhibit(id) {
    return new Promise((resolve, reject) => {
        var iframe = document.createElement('IFRAME');
        iframe.src = `https://auctions.yahoo.co.jp/sell/jp/show/resubmit?autosubmit=1&aID=${id}`;
        iframe.width = 1;
        iframe.height = 1;
        iframe.onload = function() {
            if (this.contentWindow.location.href === 'https://auctions.yahoo.co.jp/sell/jp/config/submit') {
                // 再出品完了
                document.body.removeChild(this);
                resolve();
            }
        };
        document.body.appendChild(iframe);
    });
}

function injectReexhibitBtn() {
    var table = document.querySelectorAll('#acWrContents table[bgcolor="#dcdcdc"]')[0];
    if (!table) {
        // 出品終了した商品がない
        return;
    }
    var ids = Array.prototype.map.call(table.querySelectorAll('tr'), (row) => {
        return row.querySelectorAll('td')[1].textContent;
    });
    ids.shift(); // 先頭行は「商品ID」
    if (ids.length == 0) {
        return;
    }

    var cell = document.querySelectorAll('#acWrContents table')[7].parentNode;
    var btn = document.createElement('BUTTON');
    btn.type = 'BUTTON';
    btn.classList.add('yabp-btn');
    let btnText = '表示中の商品を一括で再出品する'
    btn.innerText = btnText;
    btn.addEventListener('click', () => {
        btn.disabled = true;
        btn.innerText = btnText + ` (残り${ids.length}件)`;
        (async () => {
            for (let i = 0; i < ids.length; i++) {
                await reexhibit(ids[i]);
                btn.innerText = btnText + ` (残り${ids.length - (i + 1)}件)`;
            }
            // POSTしてから画面に反映されるまで少し時間がかかるので待つ
            btn.innerText = btnText + ' (しばらくお待ちください...)';
            window.setTimeout(() => {
                window.location.href = 'https://auctions.yahoo.co.jp/closeduser/jp/show/mystatus?select=closed&hasWinner=0';
            }, 5000);
        })();
    });
    cell.appendChild(btn);
}

function confirmReexhibit() {
    var form = document.querySelector('#auction');
    window.localStorage.setItem(`yabp.reexhibit.${form.aID.value}`, '1');
    var btn = document.querySelector('input[value="確認する"]') || document.querySelector('input[value="確認画面へ"]');
    btn.click();
}

function submitReexhibit() {
    var form = document.forms.auction;
    if (!window.localStorage.getItem(`yabp.reexhibit.${form.aID.value}`)) {
        return;
    }
    window.localStorage.removeItem(`yabp.reexhibit.${form.aID.value}`);
    var btn = document.querySelector('#auc_preview_submit');
    btn.click();
}

window.addEventListener('load', (() => {
    if (window.location.href.startsWith('https://auctions.yahoo.co.jp/openuser/jp/show/mystatus?select=selling')) {
        // 出品中一覧画面
        injectCancelPageBtn();
    } else if (window.location.href.startsWith('https://page.auctions.yahoo.co.jp/jp/show/cancelauction')) {
        // 出品キャンセル画面
        injectCancelBtn();
    } else if (window.location.href.startsWith('https://auctions.yahoo.co.jp/closeduser/jp/show/mystatus?select=closed&hasWinner=0')) {
        // 出品終了一覧画面 落札者なし
        injectReexhibitBtn();
    } else if (window.location.href.startsWith('https://auctions.yahoo.co.jp/sell/jp/show/resubmit') && window.location.href.includes('autosubmit=1')) {
        // iframe内の出品入力画面
        confirmReexhibit();
    } else if (window.location.href.startsWith('https://auctions.yahoo.co.jp/sell/jp/show/preview')) {
        // iframe内の出品確認画面
        submitReexhibit();
    }
}));