# 📖 Accessibility Guidelines for Logen V2

## 🎯 Text Readability Standards

### ❌ **AVOID - Light Gray Text Classes**
```tsx
// DON'T USE - Poor readability
className="text-gray-300"  // Too light
className="text-gray-400"  // Too light  
className="text-gray-500"  // Borderline but often too light
```

### ✅ **USE - Accessible Text Colors**
```tsx
// Primary Text
className="text-gray-900"      // Main headings and content
className="text-gray-800"      // Secondary headings

// Secondary Text  
className="text-gray-700"      // Help text, labels, descriptions
className="text-gray-600"      // Character counters, metadata

// Interactive States
className="text-blue-600"      // Links, buttons
className="text-red-500"       // Error messages
className="text-green-600"     // Success messages
```

## 🔧 **Applied Fixes in V2 Step 3**

### Before (Poor Accessibility):
```tsx
<p className="text-gray-500 mt-1">Tapez librement...</p>
<div className="text-gray-400 mt-1">{length}/200 caractères</div>
```

### After (Accessible):
```tsx
<p className="text-gray-700 mt-1">Tapez librement...</p>
<div className="text-gray-600 mt-1">{length}/200 caractères</div>
```

## 📋 **Text Hierarchy Guidelines**

| Purpose | Tailwind Class | Use Case |
|---------|---------------|----------|
| **Primary Headers** | `text-gray-900` | Main page titles, form headings |
| **Secondary Headers** | `text-gray-800` | Section titles, card headings |
| **Body Text** | `text-gray-700` | Regular content, descriptions |
| **Metadata** | `text-gray-600` | Character counters, file sizes |
| **Disabled States** | `text-gray-500` | Only for truly disabled elements |

## 🚫 **Rules for Future Development**

1. **Never use `text-gray-300` or `text-gray-400`** - These fail accessibility standards
2. **Use `text-gray-500` sparingly** - Only for disabled states or very minor metadata
3. **Always test readability** - Can you easily read the text on the background?
4. **Character counters use `text-gray-600`** - Still readable but subtle
5. **Help text uses `text-gray-700`** - Must be clearly readable

## 🎨 **Color Contrast Standards**

- **AA Standard**: Minimum 4.5:1 contrast ratio for normal text
- **AAA Standard**: Minimum 7:1 contrast ratio for enhanced accessibility

### Tailwind Gray Classes vs White Background:
- `text-gray-900`: ✅ Excellent (16:1 ratio)
- `text-gray-800`: ✅ Excellent (12:1 ratio)  
- `text-gray-700`: ✅ Very Good (9:1 ratio)
- `text-gray-600`: ✅ Good (5.7:1 ratio)
- `text-gray-500`: ⚠️ Borderline (4.6:1 ratio)
- `text-gray-400`: ❌ Fails (3.1:1 ratio)
- `text-gray-300`: ❌ Fails (2.2:1 ratio)

## 🔍 **Testing Tools**

1. **Chrome DevTools** - Lighthouse accessibility audit
2. **Wave Browser Extension** - Real-time accessibility checking
3. **Color Contrast Analyzers** - Verify text meets standards
4. **Screen Reader Testing** - Ensure content is readable

## ✅ **Implementation Checklist**

- [ ] All help text uses `text-gray-700` or darker
- [ ] Character counters use `text-gray-600` or darker  
- [ ] No use of `text-gray-400` or lighter for readable content
- [ ] Interactive elements have sufficient color contrast
- [ ] Error messages use `text-red-500` or `text-red-600`
- [ ] Success messages use `text-green-600` or darker

## 🎯 **Quick Reference**

```tsx
// ✅ GOOD Examples
<label className="text-gray-700">Field Label</label>
<p className="text-gray-700">Help text here</p>
<div className="text-gray-600">{count}/100 characters</div>
<span className="text-red-500">Error message</span>

// ❌ BAD Examples  
<label className="text-gray-400">Field Label</label>      // Too light!
<p className="text-gray-500">Help text here</p>          // Often too light!
<div className="text-gray-300">{count}/100 characters</div> // Fails accessibility!
```

## 🚀 **Benefits of Following These Guidelines**

1. **Better User Experience** - All users can read content easily
2. **Accessibility Compliance** - Meets WCAG 2.1 AA standards
3. **Professional Appearance** - Consistent, readable interface
4. **Inclusive Design** - Works for users with visual impairments
5. **SEO Benefits** - Better accessibility scores

---

**Remember**: If users struggle to read your text, your interface fails. Always prioritize readability over "subtle" styling.