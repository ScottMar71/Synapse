export type BaseCardProps = {
  title: string;
  description?: string;
};

export function formatCardTitle(input: BaseCardProps): string {
  return input.description ? `${input.title} - ${input.description}` : input.title;
}
