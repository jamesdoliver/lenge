const PRODUCT_FRAGMENT = `#graphql
  fragment ProductFields on Product {
    id
    handle
    title
    descriptionHtml
    availableForSale
    options { name values }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    images(first: 10) {
      nodes { id url altText width height }
    }
    variants(first: 50) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ...ProductFields }
  }
`;

export const PRODUCTS_BY_HANDLES_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query ProductsByHandles {
    products(first: 50, query: "handle:lenge-design-a OR handle:lenge-design-b") {
      nodes { ...ProductFields }
    }
  }
`;
