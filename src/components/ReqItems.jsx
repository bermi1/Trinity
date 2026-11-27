// The items of a money request (what each part of the money is for), with the total.
export default function ReqItems({ items, total }) {
  if (!items || !items.length) return null;
  return (
    <ul className="rq-items" aria-label="Items">
      {items.map((x, i) => <li key={i}><span>{x.d}</span><b>{x.amt}</b></li>)}
      {total ? <li className="is-total"><span>Total</span><b>{total}</b></li> : null}
    </ul>
  );
}
