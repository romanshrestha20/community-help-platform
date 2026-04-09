export const getRelativePostedTime = (value: string) => {
  const createdAt = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - createdAt, 0);

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Posted just now";
  if (minutes < 60) return `Posted ${minutes}m ago`;
  if (hours < 24) return `Posted ${hours}h ago`;
  if (days < 7) return `Posted ${days}d ago`;

  return `Posted on ${new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};
