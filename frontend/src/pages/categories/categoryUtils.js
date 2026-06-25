export function buildCategoryTree(categories) {
  const map = new Map(categories.map((category) => [category.id, { ...category, children: [] }]))
  const roots = []

  map.forEach((category) => {
    if (category.parent && map.has(category.parent)) {
      map.get(category.parent).children.push(category)
    } else {
      roots.push(category)
    }
  })

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    nodes.forEach((node) => sortNodes(node.children))
    return nodes
  }

  return sortNodes(roots)
}

export function flattenCategoryTree(nodes, level = 0, result = []) {
  nodes.forEach((node) => {
    result.push({ ...node, level })
    flattenCategoryTree(node.children, level + 1, result)
  })
  return result
}

export function getDescendantIds(categories, categoryId) {
  const directChildren = categories.filter((category) => category.parent === categoryId)
  return directChildren.flatMap((child) => [child.id, ...getDescendantIds(categories, child.id)])
}
