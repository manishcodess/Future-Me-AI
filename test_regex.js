const fs = require('fs'); const txt = fs.readFileSync('github-stats-test.xml', 'utf8'); console.log('commitsMatch:', txt.match(/data-testid="commits"[^>]*>\s*([\d,]+)\s*<\/text>/is));
