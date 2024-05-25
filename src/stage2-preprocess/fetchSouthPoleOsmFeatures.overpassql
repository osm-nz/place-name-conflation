[out:json][timeout:25];
(
  // everything with a LINZ ref south of the -85th parallel
  nwr["ref:linz:place_id"](-90,-180,-75,180);

  // and all non-multipolygon relations on the mainland, since the golang
  // parser doesn't support these. For example, waterways or railway routes.
  relation[type!=multipolygon][type!=boundary]["ref:linz:place_id"](-48,162,-32,179);

  // other queries are injected dynamically:

  /* DO NOT EDIT THIS COMMENT */
);
out tags center;
