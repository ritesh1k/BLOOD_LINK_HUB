<!-- =========================================================================
     HERO BACKGROUND IMAGE CUSTOMIZATION GUIDE
     ========================================================================= -->

# Hero Background Customization

## How to Change the Hero Background Image

The hero section currently uses a gradient overlay with a placeholder SVG. To customize it with your own blood donation theme image:

### Option 1: Replace in CSS (Recommended)

Edit `responsive-style.css`, find the `.hero` section (around line 271), and replace:

```css
.hero {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.7) 0%, rgba(192, 57, 43, 0.7) 100%), 
                url('placeholder-hero.svg') center/cover no-repeat fixed;
}
```

With your image URL:

```css
.hero {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), 
                url('YOUR_IMAGE_PATH.jpg') center/cover no-repeat fixed;
}
```

### Option 2: Online Image URL

If using an online image (e.g., from Unsplash, Pexels):

```css
.hero {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), 
                url('https://example.com/blood-donation-image.jpg') center/cover no-repeat fixed;
}
```

### Option 3: Inline Style in HTML

If you prefer HTML approach, add to the `<header class="hero">`:

```html
<header class="hero" id="home" style="background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url('your-image.jpg');">
```

---

## Image Recommendations

For best results, use an image that:
- **Size:** 1920x1080px or larger (high resolution)
- **Format:** JPG or WebP (optimized for web)
- **Theme:** Blood donation, medical, healthcare, helping others
- **Style:** Professional, inspiring, clear
- **Contrast:** Make sure text is readable over the image

### Suggested Free Image Sources:
- **Unsplash:** unsplash.com
- **Pexels:** pexels.com
- **Pixabay:** pixabay.com
- **Shutterstock:** shutterstock.com

Search for: "blood donation", "medical help", "healthcare volunteer"

---

## Mobile Optimization

The current CSS automatically:
- ✅ Disables `background-attachment: fixed` on mobile
- ✅ Adjusts background size for smaller screens
- ✅ Maintains readability with darker overlay
- ✅ Ensures good performance on all devices

---

## Gradient Overlay Customization

To change the overlay darkness/color:

**Current (dark):**
```css
linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)
```

**Lighter:**
```css
linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%)
```

**Red Tint:**
```css
linear-gradient(135deg, rgba(231, 76, 60, 0.5) 0%, rgba(192, 57, 43, 0.7) 100%)
```

**Blue Tint:**
```css
linear-gradient(135deg, rgba(52, 152, 219, 0.5) 0%, rgba(41, 128, 185, 0.7) 100%)
```

---

## Full Hero CSS Code

Here's the complete hero section CSS with both base and mobile styles:

```css
/* Desktop/Default */
.hero {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), 
                url('YOUR_IMAGE.jpg') center/cover no-repeat fixed;
    min-height: calc(100vh - 80px);
    padding: 3rem 1rem;
    position: relative;
}

.hero::before {
    content: '';
    position: absolute;
    background: rgba(0, 0, 0, 0.35);
}

/* Mobile */
@media (max-width: 768px) {
    .hero {
        min-height: 60vh;
        padding: 2rem 1rem;
        background-attachment: scroll;
    }
    
    .hero::before {
        background: rgba(0, 0, 0, 0.5);
    }
}
```

---

## Testing Checklist

After updating the background image:

- [ ] Image loads on desktop (1920px width)
- [ ] Image displays properly on tablet (768px width)
- [ ] Image displays properly on mobile (375px width)
- [ ] Text is readable over the image
- [ ] No horizontal scrolling
- [ ] Performance is good (< 3 seconds load)
- [ ] Image quality looks good (no pixelation)

---

## Troubleshooting

### Image Not Showing
- Check the file path is correct
- Ensure image file exists
- Try clearing browser cache (Ctrl+F5)
- Check browser console for errors (F12 → Console)

### Image Looks Stretched
- Ensure image resolution is at least 1920x1080
- Check `background-size: cover` is set

### Text Not Readable
- Increase overlay darkness (first number in rgba higher)
- Use a different image with better contrast
- Add `text-shadow` to text elements

### Performance Issues on Mobile
- Reduce image file size (compress to < 500KB)
- Use proper image format (WebP or optimized JPG)
- Ensure `background-attachment: scroll` on mobile (already set)

---

## Example: Complete Hero with Custom Image

```css
.hero {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 1.5rem;
    padding: 3rem 1rem;
    max-width: 1200px;
    margin: 0 auto;
    min-height: calc(100vh - 80px);
    
    /* Your custom background image */
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), 
                url('https://images.unsplash.com/photo-your-image.jpg') 
                center/cover no-repeat fixed;
    
    position: relative;
}

.hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 1;
}

.hero-content {
    position: relative;
    z-index: 2;
}

.hero-title {
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}
```

---

## Quick Image URLs (Copy & Paste)

Blood donation themed images you can use immediately:

```css
/* Red medical theme */
url('https://images.unsplash.com/photo-1576091160626-112677f00fa9?w=1920')

/* Helping hands */
url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920')

/* Medical professional */
url('https://images.unsplash.com/photo-1631217314831-9db1275506c9?w=1920')

/* Community helping */
url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920')
```

---

## Summary

The hero background is now:
✅ Fully responsive
✅ Mobile optimized
✅ Performance optimized
✅ Easy to customize
✅ Professional looking with proper overlays

Just update the image URL and you're done! 🩸
