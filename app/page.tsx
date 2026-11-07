import { ArrowRight, AtSign, Gift, Phone, Sparkles } from "lucide-react";

const products = [
  { name: "Orange", note: "Bright citrus peel and rich chocolate", image: "/images/orange.png", badge: "Zesty" },
  { name: "Mint", note: "Cool garden mint and deep cocoa", image: "/images/mint.png", badge: "Refreshing" },
  { name: "Paan", note: "Betel leaf, fennel and fragrant rose", image: "/images/paan.png", badge: "Indian favourite" },
  { name: "Walnuts", note: "Crunchy walnuts in silky chocolate", image: "/images/walnut.png", badge: "Nutty" },
  { name: "Cashew", note: "Toasted cashews and smooth cocoa", image: "/images/cashew.png", badge: "Classic" },
  { name: "Dry Fruit", note: "A generous medley of fruits and nuts", image: "/images/mixed-dried-fruits.png", badge: "Generous" },
  { name: "Protein", note: "Almonds, seeds and cocoa protein", image: "/images/protein.png", badge: "Power bite" },
  { name: "Coconut", note: "Fine coconut and creamy chocolate", image: "/images/coconut.png", badge: "Tropical" },
  { name: "Cranberry", note: "Jewel-red cranberries and dark cocoa", image: "/images/cranberry.png", badge: "Berry bright" },
  { name: "Mango", note: "Golden mango and indulgent chocolate", image: "/images/mango.png", badge: "Sun-kissed" },
  { name: "Black Currant", note: "Deep berry notes and rich chocolate", image: "/images/black-currant.png", badge: "Bold berry" },
];

export default function Home() {
  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark">C</span>
          <span>CHOCOBITES<small>CHOCOLATIER</small></span>
        </a>
        <nav>
          <a href="#flavours">Flavours</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-contact" href="tel:+918871024440"><Phone size={16} /> Order enquiry</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={13} /> SMALL BATCH · MADE WITH JOY</p>
          <h1>Chocolate worth<br /><em>remembering.</em></h1>
          <p className="lede">Eleven distinctive flavours, beautiful details, and a little everyday magic—handcrafted by Chocobites for moments that matter.</p>
          <a className="primary" href="#flavours">Explore our flavours <ArrowRight size={17} /></a>
          <div className="maker-note">
            <span>Handcrafted by <b>Malvi Shah</b></span>
            <i />
            <span>Freshly prepared on order</span>
          </div>
        </div>
        <div className="hero-art">
          <img src="/images/chocobites-hero.png" alt="An elegant Chocobites gift box with handcrafted assorted chocolates" />
        </div>
      </section>

      <section className="collection" id="flavours">
        <p className="eyebrow centered">ELEVEN FLAVOURS · ONE BEAUTIFUL INDULGENCE</p>
        <h2>Find your <em>favourite.</em></h2>
        <p className="section-sub">Every flavour is freshly made. Contact us for current pricing, quantities, gifting and custom orders.</p>
        <div className="products">
          {products.map((product) => (
            <article className="product" key={product.name}>
              <div className="product-art">
                <img src={product.image} alt={`${product.name} flavoured handcrafted chocolates`} />
                <span className="pill">{product.badge}</span>
              </div>
              <div className="product-meta">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.note}</p>
                  <strong>Freshly made to order</strong>
                </div>
                <a className="enquire" href="tel:+918871024440" aria-label={`Enquire about ${product.name}`}>
                  Enquire <ArrowRight />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="promise" id="story">
        <div>
          <p className="eyebrow">THE CHOCOBITES PROMISE</p>
          <h2>Good chocolate.<br /><em>Good feelings.</em></h2>
        </div>
        <div className="story-card">
          <Gift />
          <p>Thoughtful flavours, quality ingredients and beautiful presentation—made in small batches for celebrations, gifts and everyday cravings.</p>
          <span>Made fresh · Packed with care</span>
        </div>
      </section>

      <footer id="contact">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>CHOCOBITES<small>HANDCRAFTED CHOCOLATES</small></span>
        </div>
        <div className="contact-stack">
          <small>ORDERS & ENQUIRIES</small>
          <b>Malvi Shah</b>
          <a href="tel:+918871024440"><Phone /> +91 88710 24440</a>
          <a href="https://www.instagram.com/chocobites_malvi/" target="_blank" rel="noreferrer"><AtSign /> @chocobites_malvi</a>
        </div>
        <p>Made with care, packed with joy.</p>
      </footer>

      <div className="contact-dock">
        <a href="tel:+918871024440"><Phone /> Call to order</a>
        <a href="https://www.instagram.com/chocobites_malvi/" target="_blank" rel="noreferrer"><AtSign /> Instagram</a>
      </div>
    </main>
  );
}
