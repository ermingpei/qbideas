import OpenAI from 'openai';
import logger from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ScoringCriteria {
  marketPotential: number;      // 0-1 (30% weight)
  technicalFeasibility: number; // 0-1 (25% weight)
  innovation: number;           // 0-1 (25% weight)
  clarity: number;              // 0-1 (10% weight)
  actionability: number;        // 0-1 (10% weight)
}

export interface ScoringResult {
  scores: ScoringCriteria;
  overallScore: number;
  tier: 'regular' | 'premium';
  feedback: string[];
  approved: boolean;
}

export interface IdeaSubmissionData {
  title: string;
  teaserDescription: string;
  fullDescription: string;
  problemStatement: string;
  targetAudience: string;
  proposedSolution: string;
  category: string;
}

class IdeaScoringService {
  private readonly APPROVAL_THRESHOLD = 0.70;
  private readonly PREMIUM_THRESHOLD = 0.80;
  
  private readonly WEIGHTS = {
    marketPotential: 0.30,
    technicalFeasibility: 0.25,
    innovation: 0.25,
    clarity: 0.10,
    actionability: 0.10,
  };

  async scoreIdea(idea: IdeaSubmissionData): Promise<ScoringResult> {
    try {
      logger.info(`Starting scoring for idea: ${idea.title}`);
      
      // Use AI to evaluate each criterion
      const scores = await this.evaluateWithAI(idea);
      
      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(scores);
      
      // Determine tier (top 30% = premium, which means score >= 0.80)
      const tier = overallScore >= this.PREMIUM_THRESHOLD ? 'premium' : 'regular';
      
      // Generate feedback for low scores
      const feedback = this.generateFeedback(scores);
      
      // Determine if approved
      const approved = overallScore >= this.APPROVAL_THRESHOLD;
      
      logger.info(`Scoring complete for "${idea.title}": ${overallScore.toFixed(2)} (${approved ? 'approved' : 'rejected'})`);
      
      return {
        scores,
        overallScore,
        tier,
        feedback,
        approved,
      };
    } catch (error) {
      logger.error('Error scoring idea:', error);
      throw new Error('Failed to score idea');
    }
  }

  private async evaluateWithAI(idea: IdeaSubmissionData): Promise<ScoringCriteria> {
    const prompt = this.buildScoringPrompt(idea);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert evaluator of startup and app ideas. You provide objective, data-driven assessments based on market potential, technical feasibility, innovation, clarity, and actionability.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent scoring
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const scores = JSON.parse(content);
      
      // Validate scores are between 0 and 1
      return {
        marketPotential: this.clampScore(scores.marketPotential),
        technicalFeasibility: this.clampScore(scores.technicalFeasibility),
        innovation: this.clampScore(scores.innovation),
        clarity: this.clampScore(scores.clarity),
        actionability: this.clampScore(scores.actionability),
      };
    } catch (error) {
      logger.error('Error calling OpenAI API:', error);
      throw new Error('Failed to evaluate idea with AI');
    }
  }

  private buildScoringPrompt(idea: IdeaSubmissionData): string {
    return `
Evaluate the following app/tool idea across five criteria. Provide a score from 0.0 to 1.0 for each criterion.

**Idea Details:**
- Title: ${idea.title}
- Category: ${idea.category}
- Teaser: ${idea.teaserDescription}
- Full Description: ${idea.fullDescription}
- Problem Statement: ${idea.problemStatement}
- Target Audience: ${idea.targetAudience}
- Proposed Solution: ${idea.proposedSolution}

**Scoring Criteria:**

1. **Market Potential (0.0-1.0)**: Evaluate the size of the addressable market, revenue potential, and growth trajectory. Consider:
   - Is there a clear, sizable target market?
   - Does the idea address a real pain point?
   - Is there evidence of demand for this solution?
   - What is the monetization potential?

2. **Technical Feasibility (0.0-1.0)**: Assess how realistic it is to build this with current technology and AI tools. Consider:
   - Can this be built with existing technologies?
   - What is the complexity level?
   - Are there technical barriers or risks?
   - Is it achievable for an AI-assisted developer?

3. **Innovation (0.0-1.0)**: Evaluate the uniqueness and differentiation from existing solutions. Consider:
   - How novel is this idea?
   - What makes it different from competitors?
   - Does it offer a unique value proposition?
   - Is there potential for intellectual property?

4. **Clarity (0.0-1.0)**: Assess how well-defined and clear the problem and solution are. Consider:
   - Is the problem statement specific and clear?
   - Is the solution well-articulated?
   - Is the value proposition obvious?
   - Are the details sufficient to understand the idea?

5. **Actionability (0.0-1.0)**: Evaluate how concrete and implementable the idea is. Consider:
   - Are there clear features or steps outlined?
   - Can someone start building this immediately?
   - Is the scope well-defined?
   - Are there specific use cases or examples?

**Response Format:**
Return ONLY a JSON object with the following structure (no additional text):
{
  "marketPotential": 0.0-1.0,
  "technicalFeasibility": 0.0-1.0,
  "innovation": 0.0-1.0,
  "clarity": 0.0-1.0,
  "actionability": 0.0-1.0
}
`;
  }

  private calculateOverallScore(scores: ScoringCriteria): number {
    const weighted = 
      scores.marketPotential * this.WEIGHTS.marketPotential +
      scores.technicalFeasibility * this.WEIGHTS.technicalFeasibility +
      scores.innovation * this.WEIGHTS.innovation +
      scores.clarity * this.WEIGHTS.clarity +
      scores.actionability * this.WEIGHTS.actionability;
    
    // Round to 2 decimal places
    return Math.round(weighted * 100) / 100;
  }

  private generateFeedback(scores: ScoringCriteria): string[] {
    const feedback: string[] = [];
    const threshold = 0.7;

    if (scores.marketPotential < threshold) {
      feedback.push(
        'Market Potential: Consider expanding on the target market size, revenue potential, and growth opportunities. Provide more evidence of demand or market validation.'
      );
    }

    if (scores.technicalFeasibility < threshold) {
      feedback.push(
        'Technical Feasibility: Clarify the technical approach, required technologies, and implementation complexity. Consider simplifying or breaking down complex features.'
      );
    }

    if (scores.innovation < threshold) {
      feedback.push(
        'Innovation: Highlight what makes this idea unique compared to existing solutions. Emphasize your unique value proposition and competitive advantages.'
      );
    }

    if (scores.clarity < threshold) {
      feedback.push(
        'Clarity: Make the problem statement and solution more specific and clear. Provide concrete examples and avoid vague descriptions.'
      );
    }

    if (scores.actionability < threshold) {
      feedback.push(
        'Actionability: Provide more concrete steps, features, or use cases for implementation. Make it easier for someone to understand how to build this.'
      );
    }

    if (feedback.length === 0) {
      feedback.push('Great job! Your idea meets all quality criteria.');
    }

    return feedback;
  }

  private clampScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }
}

export const ideaScoringService = new IdeaScoringService();
