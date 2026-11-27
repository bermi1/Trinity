// The line total of a money-request item row as typed in a form: quantity × unit price (blank quantity = 1).
// Rows from before quantities ({d, amt}) count as 1 × amt.
const digits = v => String(v == null ? '' : v).replace(/\D/g, '');
export function rowTotal(x) {
  const price = +digits(x && x.price != null && x.price !== '' ? x.price : x && x.amt) || 0;
  const q = digits(x && x.qty), qty = q === '' ? 1 : +q;
  return qty * price;
}
