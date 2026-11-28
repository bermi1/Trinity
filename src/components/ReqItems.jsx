// The items of a money request (what each part of the money is for), each as quantity × unit price = line
// total ("24 × 1,000 = 24,000"; old items without a quantity show as 1 × the amount), with the total.
export default function ReqItems({ items, total }) {
  if (!items || !items.length) return null;
  return (
    <ul className="rq-items" aria-label="Items">
      {items.map((x, i) => <li key={i}><span>{x.d}{x.calc ? <small>{x.calc}</small> : null}</span><b>{x.amt}</b></li>)}
      {total ? <li className="is-total"><span>Total</span><b>{total}</b></li> : null}
    </ul>
  );
}
