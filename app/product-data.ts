// Shape of the static product samples exported by this module.
export type Product = {
 id:number;
 name:string;
 price:number;
 color:string;
 img:string;
 images:string[];
 description:string;
};

// Type alias for available sizes: S, M, L, XL, XXL
export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';

// Static sample catalog; storefront and admin routes use the editable product-store catalog.
export const products: Product[] = [
 {id:1,name:"Essential Black Tee",price:799,color:"Black",img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A clean everyday tee cut for easy movement and layered styling."},
 {id:2,name:"Classic White Tee",price:699,color:"White",img:"https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A soft white staple with a relaxed shape that works all year."},
 {id:3,name:"Oversized Sand Tee",price:899,color:"Sand",img:"https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"An oversized silhouette in a warm sand tone for a modern everyday look."},
 {id:4,name:"Minimal Grey Tee",price:749,color:"Grey",img:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A minimal grey tee with a comfortable fit and understated finish."}
];

// Garment measurements in centimeters, shown on product pages beside size selection.
export const sizeChart: Record<Size,{chest:number;length:number;shoulder:number}> = {
 S:{chest:96,length:68,shoulder:43},
 M:{chest:102,length:71,shoulder:45},
 L:{chest:108,length:74,shoulder:47},
 XL:{chest:114,length:77,shoulder:49},
 XXL:{chest:120,length:80,shoulder:51}
};

// Ordered list of available sizes used for rendering size selectors and inventory grids
export const sizes: Size[] = ['S','M','L','XL','XXL'];
