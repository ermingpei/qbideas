# AI Integration Plan - Moonshot AI

## 🎯 Goal
Integrate Moonshot AI to generate startup ideas instead of OpenAI.

## 📋 Current Status

### Issues Fixed
- ✅ Error handler (`createApiError` removed)
- ✅ API restarted and working
- ✅ Frontend restarted
- ✅ `/trending` page created

### What's Working
- ✅ Backend API with 10 sample ideas
- ✅ Frontend displaying pages
- ✅ Database with seeded data

## 🤖 Moonshot AI Integration

### API Details
- **Provider**: Moonshot AI
- **API Key**: `sk-UmVcXa9TXHkcxVBZXCqIEIJ1wvCg2VPoaSmyETybV4oLh22U`
- **Base URL**: https://api.moonshot.cn/v1
- **Model**: moonshot-v1-8k (or moonshot-v1-32k for longer content)

### Cost Estimation

**Moonshot AI Pricing** (as of 2024):
- moonshot-v1-8k: ¥0.012/1K tokens (~$0.0017/1K tokens)
- moonshot-v1-32k: ¥0.024/1K tokens (~$0.0034/1K tokens)

**Per Idea Generation**:
- Prompt: ~500 tokens
- Response: ~2000 tokens
- Total: ~2500 tokens per idea
- Cost: ~¥0.03 (~$0.004) per idea

**Monthly Estimates**:
- 100 ideas/month: ~¥3 (~$0.42)
- 500 ideas/month: ~¥15 (~$2.10)
- 1000 ideas/month: ~¥30 (~$4.20)

**Comparison with OpenAI**:
- OpenAI GPT-4: ~$0.03-0.06 per idea
- Moonshot is **~10-15x cheaper** than OpenAI!

## 🛠️ Implementation Steps

### 1. Install Dependencies
```bash
cd services/api
npm install axios
```

### 2. Create Moonshot Client
Create `services/api/src/utils/moonshot.ts`:

```typescript
import axios from 'axios';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_BASE_URL = 'https://api.moonshot.cn/v1';

export async function generateIdeaWithMoonshot(prompt: string) {
  const response = await axios.post(
    `${MOONSHOT_BASE_URL}/chat/completions`,
    {
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: 'You are a startup idea generator. Generate detailed, researched startup ideas with market analysis, technical requirements, and execution plans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}
```

### 3. Update Environment Variables
Add to `.env`:
```env
MOONSHOT_API_KEY=sk-UmVcXa9TXHkcxVBZXCqIEIJ1wvCg2VPoaSmyETybV4oLh22U
```

### 4. Create Idea Generation Script
Create `services/api/src/scripts/generate-ideas-moonshot.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { generateIdeaWithMoonshot } from '../utils/moonshot';
import slugify from 'slugify';

const prisma = new PrismaClient();

const categories = [
  'saas', 'mobile_app', 'web_app', 'chrome_extension',
  'api_service', 'marketplace', 'productivity', 'devtools'
];

async function generateIdea(category: string) {
  const prompt = `Generate a unique startup idea for the ${category} category.

Include:
1. Title (catchy, under 60 characters)
2. Teaser (one sentence, under 150 characters)
3. Full description (2-3 paragraphs)
4. Problem statement
5. Solution overview
6. Target market
7. Market potential score (0-10)
8. Technical feasibility score (0-10)
9. Innovation score (0-10)
10. Estimated cost to build ($)
11. Estimated time to launch (days)
12. Difficulty level (beginner/intermediate/advanced)
13. Recommended tech stack

Format as JSON.`;

  const response = await generateIdeaWithMoonshot(prompt);
  const ideaData = JSON.parse(response);

  // Create idea in database
  await prisma.ideas.create({
    data: {
      title: ideaData.title,
      slug: slugify(ideaData.title, { lower: true, strict: true }),
      teaserDescription: ideaData.teaser,
      fullDescription: ideaData.fullDescription,
      category: category,
      tags: ideaData.tags || [],
      tier: 'regular',
      source: 'ai',
      difficultyLevel: ideaData.difficultyLevel,
      marketPotentialScore: ideaData.marketPotentialScore,
      technicalFeasibilityScore: ideaData.technicalFeasibilityScore,
      innovationScore: ideaData.innovationScore,
      overallScore: (ideaData.marketPotentialScore + ideaData.technicalFeasibilityScore + ideaData.innovationScore) / 3,
      estimatedCost: ideaData.estimatedCost,
      estimatedLaunchTime: ideaData.estimatedTime,
      problemStatement: ideaData.problemStatement,
      solutionOverview: ideaData.solutionOverview,
      targetMarket: ideaData.targetMarket,
      technicalArchitecture: ideaData.techStack,
    }
  });

  console.log(`✓ Generated: ${ideaData.title}`);
}

async function main() {
  console.log('🤖 Generating ideas with Moonshot AI...\n');

  for (const category of categories) {
    try {
      await generateIdea(category);
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Failed to generate ${category} idea:`, error);
    }
  }

  console.log('\n✅ Idea generation complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 5. Run Generation
```bash
cd services/api
npx tsx src/scripts/generate-ideas-moonshot.ts
```

## 📊 Expected Results

### Generation Time
- 8 ideas × 1 second = ~8 seconds
- Plus API response time: ~15-20 seconds total

### Cost
- 8 ideas × ¥0.03 = ¥0.24 (~$0.03)
- Extremely cost-effective!

### Quality
- Moonshot AI is trained on Chinese and English data
- Good for general startup ideas
- May need prompt tuning for best results

## 🎯 Next Steps

### Immediate (Today)
1. Add Moonshot API key to `.env`
2. Create moonshot client utility
3. Test with single idea generation
4. Verify JSON parsing works

### Short Term (This Week)
1. Create batch generation script
2. Generate 50-100 ideas
3. Review and curate quality
4. Add to database

### Medium Term (Next Week)
1. Schedule automated generation (daily/weekly)
2. Add idea quality scoring
3. Implement idea review workflow
4. Add admin panel for curation

## 🔧 Troubleshooting

### If API Fails
- Check API key is correct
- Verify base URL
- Check rate limits
- Review error messages

### If JSON Parsing Fails
- Add error handling
- Use structured prompts
- Validate response format
- Add retry logic

### If Quality is Low
- Refine prompts
- Add more context
- Use examples
- Increase temperature

## 💡 Optimization Tips

1. **Batch Processing**: Generate multiple ideas in parallel
2. **Caching**: Store generated ideas for review before publishing
3. **Quality Filter**: Auto-reject low-scoring ideas
4. **Human Review**: Manual approval for premium ideas
5. **A/B Testing**: Test different prompts for better results

## 📝 Monitoring

Track these metrics:
- Ideas generated per day
- API cost per idea
- Average quality scores
- User engagement with AI ideas
- Conversion rate (views → unlocks)

---

**Ready to integrate Moonshot AI!** 🚀

Cost: ~$0.004 per idea (10-15x cheaper than OpenAI)
Time: ~2 seconds per idea
Quality: Good for MVP, can be refined
