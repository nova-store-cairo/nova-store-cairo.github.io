-- =====================================================
-- DEMO DATA: 45 fake orders over the last 14 days,
-- so the Sales charts have something to show.
-- All have names starting with "Demo customer".
-- =====================================================
insert into orders (customer_name, customer_phone, customer_address, items, total, status, created_at)
select
  'Demo customer ' || g,
  '0100000' || lpad(g::text, 4, '0'),
  'Demo address, Cairo',
  x.items,
  x.total,
  (array['new', 'confirmed', 'delivered', 'delivered', 'delivered', 'cancelled'])[1 + floor(random() * 6)::int],
  now() - (random() * 14) * interval '1 day'
from generate_series(1, 45) as g
cross join lateral (
  select
    jsonb_agg(jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'price', p.price,
      'size', p.sizes[1 + floor(random() * array_length(p.sizes, 1))::int]
    )) as items,
    sum(p.price)::int as total
  from (
    select * from products
    order by random() + g * 0
    limit 1 + (g * 7) % 3
  ) as p
) as x;

-- To REMOVE all demo orders later, run only this line:
-- delete from orders where customer_name like 'Demo customer %';
