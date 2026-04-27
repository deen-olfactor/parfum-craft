const fs = require('fs');

const TM = {
  AC: "Aroma Chemical", NI: "Natural Isolate", EO: "Essential Oil",
  ABS: "Absolute", RES: "Resinoid", CO2: "CO2 Extract",
  SYN: "Synthetic", ISO: "Isolate", TIN: "Tincture", BA: "Base/Accord"
};
const SM = {
  FW: ["Fraterworks", "https://fraterworks.com"],
  SC: ["Scentree", "https://scentree.co"],
  TGSC: ["The Good Scent Company", "https://thegoodscentscompany.com"],
  JP: ["Jusparfum", "https://jusparfum.com"],
  PW: ["Pell Wall", "https://perfumersapprentice.com"],
  PA: ["Perfumer's Apprentice", "https://perfumersapprentice.com"],
  SA: ["Sigma-Aldrich", "https://sigmaaldrich.com"],
  EF: ["Ecofragrantica", "https://ecofragrantica.com"]
};
const IM = { U: "Unrestricted", R: "Restricted", P: "Prohibited (EU)" };

const jsxContent = fs.readFileSync('/home/hp/Downloads/parfum-reference-with-luzi.jsx', 'utf8');

// Simple line-based extraction - each line is an array entry
function extractRawArrayByLines(content, arrayName) {
  const lines = content.split('\n');
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`const ${arrayName} = [`)) {
      startLine = i;
      break;
    }
  }

  if (startLine === -1) {
    console.log(`Could not find ${arrayName}`);
    return [];
  }

  const result = [];
  // Each line that starts with [ and ends with ], potentially with trailing comma
  for (let i = startLine + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }
    
    // Check if this is an array entry line
    if (line.startsWith('[') && line.endsWith('],')) {
      // Remove trailing comma
      line = line.slice(0, -1);
      result.push(line);
    } else if (line.startsWith('[') && line.endsWith(']')) {
      result.push(line);
    } else if (line.startsWith(']')) {
      // End of array
      break;
    }
  }
  
  return result;
}

// Parse a single material line like ["Iso E Super","54464-57-2","AC","Woody,Earthy","U","FW",0.12,"Base","Transparent cedarwood..."]
function parseMaterialLine(line) {
  // Remove surrounding brackets
  let content = line.replace(/^\[|\]$/g, '');
  
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let depth = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (inString) {
      if (char === stringChar && content[i-1] !== '\\') {
        inString = false;
      }
      current += char;
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === '[') {
        depth++;
        current += char;
      } else if (char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        // Remove surrounding quotes and push
        let val = current.trim();
        if ((val.startsWith('"') && val.endsWith('"')) || 
            (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Unescape any escaped characters
        val = val.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        values.push(val);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  // Last value
  if (current.trim()) {
    let val = current.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || 
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    values.push(val);
  }
  
  return values;
}

function parseMaterial(arr, idx) {
  if (!Array.isArray(arr) || arr.length < 9) return null;
  const [name, cas, typeCode, odors, ifraCode, srcCode, price, usage, notes] = arr;
  const [src, url] = SM[srcCode] || ["Other", ""];

  return {
    name,
    cas: cas === "None" || cas === "none" ? null : cas,
    type: TM[typeCode] || typeCode,
    odor: odors.split(",").map(o => o.trim()),
    ifra: IM[ifraCode] || ifraCode,
    source: src,
    sourceUrl: url,
    pricePerUnit: parseFloat(price),
    priceCurrency: srcCode === "EF" ? "IDR" : "USD",
    usage,
    notes
  };
}

// Extract all materials from each RAW_V
const rawV1Lines = extractRawArrayByLines(jsxContent, 'RAW_V1');
const rawV2Lines = extractRawArrayByLines(jsxContent, 'RAW_V2');
const rawV3Lines = extractRawArrayByLines(jsxContent, 'RAW_V3');
const rawV4Lines = extractRawArrayByLines(jsxContent, 'RAW_V4');
const rawV5Lines = extractRawArrayByLines(jsxContent, 'RAW_V5');

const rawV1 = rawV1Lines.map(l => parseMaterialLine(l)).filter(a => a.length >= 9);
const rawV2 = rawV2Lines.map(l => parseMaterialLine(l)).filter(a => a.length >= 9);
const rawV3 = rawV3Lines.map(l => parseMaterialLine(l)).filter(a => a.length >= 9);
const rawV4 = rawV4Lines.map(l => parseMaterialLine(l)).filter(a => a.length >= 9);
const rawV5 = rawV5Lines.map(l => parseMaterialLine(l)).filter(a => a.length >= 9);

console.log(`RAW_V1: ${rawV1.length} materials`);
console.log(`RAW_V2: ${rawV2.length} materials`);
console.log(`RAW_V3: ${rawV3.length} materials`);
console.log(`RAW_V4: ${rawV4.length} materials`);
console.log(`RAW_V5: ${rawV5.length} materials`);

const allRaws = [...rawV1, ...rawV2, ...rawV3, ...rawV4, ...rawV5];
const allMaterials = allRaws.map((arr, idx) => {
  const parsed = parseMaterial(arr, idx);
  if (parsed) {
    return { id: `m${idx + 1}`, ...parsed };
  }
  return null;
}).filter(m => m !== null);

console.log(`Total materials: ${allMaterials.length}`);

// Extract formulas - simplified approach using regex on the raw content
function extractFormulaObjects(content, arrayName) {
  // Find start of the array
  const startMarker = `const ${arrayName} = [`;
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return [];
  
  // Find end by counting brackets
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let i = startIdx + startMarker.length - 1; // start at the [
  
  while (i < content.length) {
    const char = content[i];
    
    if (inString) {
      if (char === stringChar && content[i-1] !== '\\') {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
        if (depth === 0) {
          // Found the closing bracket
          const arrayContent = content.substring(startIdx + startMarker.length - 1, i + 1);
          // Use eval to parse (safe here since we control the source)
          try {
            return eval(`(function() { return ${arrayContent}; })()`);
          } catch (e) {
            console.log(`Error parsing ${arrayName}: ${e.message}`);
            return [];
          }
        }
      }
    }
    i++;
  }
  
  return [];
}

const seedFormulas = extractFormulaObjects(jsxContent, 'SEED_FORMULAS');
const seedFormulasV2 = extractFormulaObjects(jsxContent, 'SEED_FORMULAS_V2');

console.log(`SEED_FORMULAS: ${seedFormulas.length} formulas`);
console.log(`SEED_FORMULAS_V2: ${seedFormulasV2.length} formulas`);

// Transform formulas
function transformFormula(f, index, prefix) {
  return {
    id: `${prefix}${index + 1}`,
    name: f.name,
    type: f.concentration || "accord",
    family: f.family || "Unknown",
    notes: f.notes || "",
    createdAt: f.createdAt || "2025-01-01",
    ingredients: (f.ingredients || []).map(ing => ({
      materialName: ing.n,
      percentage: ing.a
    }))
  };
}

const transformedSeed = seedFormulas.map((f, i) => transformFormula(f, i, 'f'));
const transformedSeedV2 = seedFormulasV2.map((f, i) => transformFormula(f, i, 'fv2_'));

const allFormulas = [...transformedSeed, ...transformedSeedV2];

console.log(`Total formulas: ${allFormulas.length}`);

// Write JSON files
fs.writeFileSync('/home/hp/parfumcraft/src/data/allMaterials.json', JSON.stringify(allMaterials, null, 2));
fs.writeFileSync('/home/hp/parfumcraft/src/data/seedFormulas.json', JSON.stringify(allFormulas, null, 2));

console.log('Files written successfully!');
console.log(`allMaterials.json: ${allMaterials.length} materials`);
console.log(`seedFormulas.json: ${allFormulas.length} formulas`);
