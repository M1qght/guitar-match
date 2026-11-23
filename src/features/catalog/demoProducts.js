export const categories = [
  { id: 'classical', label: 'Классическая', strings: 'Нейлоновые струны' },
  { id: 'steel_acoustic', label: 'Акустическая', strings: 'Стальные струны' },
  { id: 'electric', label: 'Электрогитара', strings: 'Магнитные звукосниматели' },
];

export const demoProducts = [
  { slug: 'demo-classical', model: 'Nylon 01', type: 'classical', image: '/images/classical.jpg' },
  { slug: 'demo-acoustic', model: 'Folk 02', type: 'steel_acoustic', image: '/images/acoustic.jpg' },
  { slug: 'demo-electric', model: 'Drive 03', type: 'electric', image: '/images/electric.jpg' },
];

export function getCategory(type) {
  return categories.find((category) => category.id === type);
}
