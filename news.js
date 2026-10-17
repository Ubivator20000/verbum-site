// Новости на сайте — тот же текст и тот же формат, что в лаунчере (news.txt):
//   // …         — пометка, на сайте не видна;
//   # Заголовок  — начало новости;
//   текст        — абзац (соседние строки склеиваются, пустая строка — новый абзац);
//   - пункт      — пункт списка;
//   https://…    — ссылка.
// Текст лежит в news-data.js (его собирает prepare.ps1 из news.txt): так страница работает и открытой
// прямо с диска, без сервера.
(function () {
	var box = document.getElementById('news-list');
	var text = window.VERBUM_NEWS;
	if (!box) {
		return;
	}
	if (typeof text !== 'string') {
		box.innerHTML = '<p class="muted">Новостей пока нет.</p>';
		return;
	}

	function parse(source) {
		var entries = [];
		var current = null;
		var paragraph = [];
		function flush() {
			if (paragraph.length) {
				current.blocks.push(paragraph.join(' '));
				paragraph = [];
			}
		}
		function ensure() {
			if (!current) {
				current = {title: null, blocks: []};
			}
		}
		source.replace(/\r\n/g, '\n').split('\n').forEach(function (raw) {
			var line = raw.trim();
			if (line.indexOf('//') === 0) {
				return;
			}
			if (line.charAt(0) === '#') {
				if (current) {
					flush();
					entries.push(current);
				}
				current = {title: line.replace(/^#+/, '').trim(), blocks: []};
			} else if (line === '') {
				if (current) {
					flush();
				}
			} else if (line.indexOf('- ') === 0 || line.indexOf('• ') === 0) {
				ensure();
				flush();
				current.blocks.push({item: line.substring(2).trim()});
			} else {
				ensure();
				paragraph.push(line);
			}
		});
		if (current) {
			flush();
			if (current.title || current.blocks.length) {
				entries.push(current);
			}
		}
		return entries;
	}

	// Строка с нажимаемыми ссылками — без innerHTML: текст из файла не может стать кодом страницы.
	function inline(parent, line) {
		var link = /https?:\/\/[^\s<>"]+/g;
		var last = 0;
		var match;
		while ((match = link.exec(line)) !== null) {
			parent.appendChild(document.createTextNode(line.substring(last, match.index)));
			var a = document.createElement('a');
			a.href = match[0];
			a.textContent = match[0];
			a.rel = 'noopener';
			a.target = '_blank';
			parent.appendChild(a);
			last = match.index + match[0].length;
		}
		parent.appendChild(document.createTextNode(line.substring(last)));
	}

	var entries = parse(text);
	box.innerHTML = '';
	if (!entries.length) {
		box.innerHTML = '<p class="muted">Новостей пока нет.</p>';
		return;
	}
	entries.forEach(function (entry) {
		var article = document.createElement('article');
		if (entry.title) {
			var h = document.createElement('h3');
			inline(h, entry.title);
			article.appendChild(h);
		}
		var list = null;
		entry.blocks.forEach(function (block) {
			if (typeof block === 'object') {
				if (!list) {
					list = document.createElement('ul');
					article.appendChild(list);
				}
				var li = document.createElement('li');
				inline(li, block.item);
				list.appendChild(li);
			} else {
				list = null;
				var p = document.createElement('p');
				inline(p, block);
				article.appendChild(p);
			}
		});
		box.appendChild(article);
	});
})();
