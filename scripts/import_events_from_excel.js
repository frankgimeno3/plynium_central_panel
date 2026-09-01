const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
  const idx = trimmed.indexOf('=');
  env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const workbook = XLSX.readFile('C:/Users/frank/Downloads/FERIAS BEIJING JOINING.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

function parseDateRange(value) {
  if (!value) return null;
  const str = String(value).trim();
  const monthMap = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  const range = str.match(/(\d{1,2})[^\d]*(\d{1,2})?[^\w]*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i);
  if (range) {
    const day1 = parseInt(range[1], 10);
    const day2 = range[2] ? parseInt(range[2], 10) : day1;
    const month = monthMap[range[3].toLowerCase()];
    const year = parseInt(range[4], 10);
    const start = new Date(Date.UTC(year, month, day1));
    const end = new Date(Date.UTC(year, month, day2));
    const fmt = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
  }

  const single = str.match(/(\d{1,2})[^\w]*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i);
  if (single) {
    const day = parseInt(single[1], 10);
    const month = monthMap[single[2].toLowerCase()];
    const year = parseInt(single[3], 10);
    const dt = new Date(Date.UTC(year, month, day));
    const fmt = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { start: fmt(dt), end: fmt(dt) };
  }

  return null;
}

function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toEnglishTitle(name) {
  return String(name)
    .replace(/\s+/g, ' ')
    .replace(/\bvidrio\b/gi, 'glass')
    .replace(/\bventanas\b/gi, 'windows')
    .replace(/\bfachadas\b/gi, 'facades')
    .replace(/\bprotección solar\b/gi, 'solar protection')
    .replace(/\btecnología\b/gi, 'technology')
    .replace(/\bferia internacional de\b/gi, 'International Fair of ')
    .replace(/\bferia\b/gi, 'Fair')
    .replace(/\bexpo\b/gi, 'Expo')
    .replace(/\bde\b/gi, 'of')
    .replace(/\s+/g, ' ')
    .trim();
}

const sequelize = new Sequelize({
  database: env.DATABASE_NAME,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT || 5432),
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('connected');

    let inserted = 0;
    for (const row of rows) {
      const parsed = parseDateRange(row.Fecha);
      if (!parsed) continue;

      const eventName = toEnglishTitle(row.Feria || row['Feria'] || 'Untitled Fair');
      const idFair = `fair-26-${slugify(eventName).slice(0, 20)}-${String(inserted + 1).padStart(3, '0')}`;
      const payload = {
        id_fair: idFair,
        event_name: eventName,
        country: String(row.Ciudad || '').trim(),
        main_description: `${row.Periodicidad || ''} • ${row.Temática || ''}`.trim(),
        region: String(row.Ciudad || '').trim(),
        start_date: parsed.start,
        end_date: parsed.end,
        location: String(row.Ciudad || '').trim(),
        event_main_image: '',
        id_customer: null,
      };

      await sequelize.query(
        `INSERT INTO public.events (event_id, event_name, event_country, event_location, event_main_description, event_region, event_start_date, event_end_date, event_created_at, event_updated_at, event_main_image_src, customer_id)
         VALUES (:id_fair, :event_name, :country, :location, :main_description, :region, :start_date, :end_date, NOW(), NOW(), :event_main_image, :id_customer)
         ON CONFLICT (event_id) DO NOTHING`,
        { replacements: payload }
      );
      inserted += 1;
    }

    console.log(`done ${inserted}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
