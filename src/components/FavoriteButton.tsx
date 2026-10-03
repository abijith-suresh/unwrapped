import { useFavorites } from "@/components/favorites";

interface Props {
  toolId: string;
  toolName: string;
  class?: string;
}
export default function FavoriteButton(props: Props) {
  const favorites = useFavorites();
  const label = () =>
    `${favorites.contains(props.toolId) ? "Remove" : "Add"} ${props.toolName} ${favorites.contains(props.toolId) ? "from" : "to"} favorites`;
  return (
    <button
      type="button"
      class={`favorite-button ${props.class ?? ""}`}
      aria-label={label()}
      title={label()}
      aria-pressed={favorites.contains(props.toolId)}
      onClick={() => favorites.toggle(props.toolId)}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={favorites.contains(props.toolId) ? "currentColor" : "none"}
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91L12 3Z" />
      </svg>
    </button>
  );
}
