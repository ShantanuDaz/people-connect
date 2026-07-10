document.addEventListener('DOMContentLoaded', () => {
    const keysListEl = document.getElementById('keys-list');
    const searchInput = document.getElementById('search-input');
    const viewerHeaderEl = document.getElementById('current-key');
    const viewerContentEl = document.getElementById('viewer-content');

    let databaseData = [];

    // Fetch data from API
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            databaseData = data;
            renderKeys(databaseData);
        })
        .catch(err => {
            showError("Failed to fetch database data. Is the server running correctly?");
            console.error(err);
        });

    function showError(msg) {
        keysListEl.innerHTML = `<div style="padding:20px;color:#ef4444">${msg}</div>`;
    }

    function renderKeys(data) {
        keysListEl.innerHTML = '';
        if (data.length === 0) {
            keysListEl.innerHTML = '<div style="padding:20px;color:var(--text-muted)">No keys found in database.</div>';
            return;
        }

        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'key-item';
            el.textContent = item.key;
            el.onclick = () => {
                // Remove active from all
                document.querySelectorAll('.key-item').forEach(n => n.classList.remove('active'));
                el.classList.add('active');
                renderValue(item);
            };
            keysListEl.appendChild(el);
        });
    }

    function renderValue(item) {
        viewerHeaderEl.textContent = item.key;
        
        let displayStr = '';
        if (typeof item.value === 'object' && item.value !== null) {
            displayStr = syntaxHighlight(JSON.stringify(item.value, null, 2));
        } else {
            displayStr = syntaxHighlight(JSON.stringify(item.value));
        }

        viewerContentEl.innerHTML = `<pre class="json-display">${displayStr}</pre>`;
    }

    // JSON Syntax Highlighting
    function syntaxHighlight(json) {
        if (!json) return '';
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = databaseData.filter(d => d.key.toLowerCase().includes(term));
        renderKeys(filtered);
    });
});
