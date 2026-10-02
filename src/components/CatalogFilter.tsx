interface Props {
  favorites: boolean;
  count: number;
  onChange: (value: boolean) => void;
}
export default function CatalogFilter(props: Props) {
  return (
    <fieldset class="catalog-filter" aria-label="Show tools">
      <button type="button" aria-pressed={!props.favorites} onClick={() => props.onChange(false)}>
        All tools
      </button>
      <button
        type="button"
        aria-pressed={props.favorites}
        aria-label="Favorites"
        onClick={() => props.onChange(true)}
      >
        Favorites
        <span class="catalog-filter-count" aria-hidden="true">
          {props.count}
        </span>
      </button>
    </fieldset>
  );
}
