import data from './recipes.json';

export interface Recipe {
	slug: string;
	title: string;
	date?: string;
	tags: string[];
	note?: string;
	images?: string[];
}

export const recipes: Recipe[] = data;

export function recipeImages(recipe: Recipe): string[] {
	return recipe.images ?? [`/recipes/${recipe.slug}.jpg`];
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatRecipeDate(iso: string): string {
	const [y, m, d] = iso.split('-').map(Number);
	if (!y || !m || !d) return iso;
	return `${d} ${months[m - 1]} ${y}`;
}
