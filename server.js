// server.js (Node 18+)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());
app.use(cors());

const DB = './orders.json';
function load() {
  try { return JSON.parse(fs.readFileSync(DB)); } catch(e){ return {}; }
}
function save(data){ fs.writeFileSync(DB, JSON.stringify(data, null,2)); }

app.post('/create-order', (req, res) => {
  const { orderId, amount, pa, pn, tn } = req.body;
  const db = load();
  db[orderId] = { orderId, amount, pa, pn, tn, status:'created', createdAt: new Date().toISOString() };
  save(db);
  res.json({ ok:true });
});

app.get('/order-status', (req,res) => {
  const orderId = req.query.orderId;
  const db = load();
  if (!orderId || !db[orderId]) return res.json({ status: 'unknown' });
  return res.json({ status: db[orderId].status, info: db[orderId] });
});

// Endpoint for SMS-confirmation app to POST payment confirmation
app.post('/confirm-payment', (req,res) => {
  // Payload: { orderId, upiTxnId, rxAmount, payerVpa, rawSms }
  const { orderId, upiTxnId, rxAmount, payerVpa, rawSms } = req.body;
  if (!orderId) return res.status(400).json({ error:'orderId required' });
  const db = load();
  if (!db[orderId]) db[orderId] = { orderId, createdAt: new Date().toISOString() };
  db[orderId].status = 'paid';
  db[orderId].paidAt = new Date().toISOString();
  db[orderId].upiTxnId = upiTxnId;
  db[orderId].rxAmount = rxAmount;
  db[orderId].payerVpa = payerVpa;
  db[orderId].rawSms = rawSms;
  save(db);
  res.json({ ok:true });
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('listening on', port));
