// Lecture des fichiers Excel importés, isolée dans un worker : un fichier piégé ne peut ni
// polluer la page (failles connues de SheetJS 0.18.5) ni la figer (la page coupe le worker).
importScripts('xlsx.full.min.js');
onmessage = function (e) {
  try {
    var wb = XLSX.read(e.data, { type: 'array' });
    var ws = wb.Sheets[wb.SheetNames[0]];
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    postMessage({ aoa: JSON.parse(JSON.stringify(aoa)) });
  } catch (err) { postMessage({ error: String((err && err.message) || err) }); }
};
