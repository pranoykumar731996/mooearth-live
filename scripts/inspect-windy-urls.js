async function inspect() {
  const res = await fetch('https://www.windy.com/v/51.3.2.ind.81aa/plugins/radar-plus.js');
  const t = await res.text();
  const m = t.match(/sat\.windy\.com[a-zA-Z0-9_\-\.\/\{\}]*/g);
  console.log('sat.windy.com occurrences:', [...new Set(m)]);
}
inspect();
