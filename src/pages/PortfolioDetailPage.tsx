import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { linkRecords, logActivity, trackRecent } from '@/services/data-service'
import type { PortfolioCaseStudy, Project } from '@/types'
import { copyText, newPortfolioCaseStudy, withUpdated } from '@/pages/page-utils'
import { downloadText, slugify } from '@/utils'

type PortfolioContext = {
  study: PortfolioCaseStudy | null
  projects: Project[]
}

function githubReadme(study: PortfolioCaseStudy): string {
  return `# ${study.title}

${study.oneSentenceSummary}

## Business problem
${study.businessProblem}

## Dataset
${study.dataset}

## Tools
${study.tools}

## Process
${study.process}

## Data cleaning
${study.dataCleaning}

## Analysis
${study.analysis}

## Dashboard
${study.dashboard}

## Key findings
${study.keyFindings}

## Recommendations
${study.recommendations}

## Challenges and lessons
${study.challenges}

${study.lessonsLearned}

## Links
${study.links}
`
}

function webpageCopy(study: PortfolioCaseStudy): string {
  return `${study.title}

${study.oneSentenceSummary}

Problem: ${study.businessProblem}

Approach: ${study.process}

Tools used: ${study.tools}

Findings: ${study.keyFindings}

Recommendation: ${study.recommendations}

Impact framing: ${study.resumeImpact}
`
}

function resumeBullets(study: PortfolioCaseStudy): string {
  const action = study.resumeAction || 'Delivered'
  const method = study.resumeMethod || study.process
  const scope = study.resumeScope || study.dataset
  const result = study.resumeResult || study.keyFindings
  const impact = study.resumeImpact || study.recommendations
  return `- ${action} ${method} across ${scope}, resulting in ${result} and ${impact}.
- Built an analytics case study using ${study.tools} to address ${study.businessProblem}, translating findings into ${study.recommendations}.`
}

function linkedinDescription(study: PortfolioCaseStudy): string {
  return `I completed a portfolio project: ${study.title}.

${study.oneSentenceSummary}

The business problem was ${study.businessProblem}. I used ${study.tools} and followed this process: ${study.process}.

Key finding: ${study.keyFindings}

Recommendation: ${study.recommendations}`
}

function starStory(study: PortfolioCaseStudy): string {
  return `Situation: ${study.businessProblem}

Task: ${study.oneSentenceSummary}

Action: ${study.resumeAction || 'I analyzed'} ${study.resumeMethod || study.process} for ${study.resumeScope || study.dataset}.

Result: ${study.resumeResult || study.keyFindings}

Impact: ${study.resumeImpact || study.recommendations}`
}

function allMarkdown(study: PortfolioCaseStudy): string {
  return `# ${study.title}

## GitHub README
${study.githubReadme}

## Webpage copy
${study.webpageCopy}

## Resume bullets
${study.resumeBullets}

## LinkedIn
${study.linkedinDescription}

## STAR
${study.starStory}
`
}

const GENERATED_SECTIONS: Array<{
  label: string
  field: 'githubReadme' | 'webpageCopy' | 'resumeBullets' | 'linkedinDescription' | 'starStory'
}> = [
  { label: 'GitHub README', field: 'githubReadme' },
  { label: 'Webpage copy', field: 'webpageCopy' },
  { label: 'Resume bullets', field: 'resumeBullets' },
  { label: 'LinkedIn', field: 'linkedinDescription' },
  { label: 'STAR', field: 'starStory' },
]

export default function PortfolioDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<PortfolioCaseStudy | null>(null)
  const [copied, setCopied] = useState('')
  const loadContext = useCallback(async (): Promise<PortfolioContext> => {
    const study =
      id === 'new' ? newPortfolioCaseStudy('New portfolio case study') : (await db.portfolioCaseStudies.get(id)) ?? null
    const projects = await db.projects.orderBy('updatedAt').reverse().toArray()
    return { study, projects }
  }, [id, refresh])
  const context = useLiveQuery(loadContext, [], { study: null, projects: [] })

  useEffect(() => {
    setDraft(context.study)
    if (context.study && id !== 'new') {
      void trackRecent('portfolio_case_study', context.study.id, context.study.title)
    }
  }, [context.study, id])

  const selectedProject = context.projects.find((project) => project.id === draft?.projectId)

  if (!draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="Case study not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'Portfolio', to: '/portfolio' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No case study found"
          description="Create a case study from the portfolio page."
          action={<Button onClick={() => navigate('/portfolio')}>Back to portfolio</Button>}
        />
      </div>
    )
  }

  async function save() {
    const currentDraft = draft!
    const next = withUpdated<PortfolioCaseStudy>({
      ...currentDraft,
      title: currentDraft.title.trim() || 'Untitled case study',
    })
    await db.portfolioCaseStudies.put(next)
    if (next.projectId) {
      await linkRecords({ type: 'project', id: next.projectId }, { type: 'portfolio_case_study', id: next.id })
    }
    await logActivity('portfolio', `Saved case study ${next.title}`, {
      type: 'portfolio_case_study',
      id: next.id,
    })
    if (id === 'new') navigate(`/portfolio/${next.id}`, { replace: true })
    setRefresh((v) => v + 1)
  }

  function generateTemplates() {
    const currentDraft = draft!
    setDraft({
      ...currentDraft,
      githubReadme: githubReadme(currentDraft),
      webpageCopy: webpageCopy(currentDraft),
      resumeBullets: resumeBullets(currentDraft),
      linkedinDescription: linkedinDescription(currentDraft),
      starStory: starStory(currentDraft),
    })
  }

  async function copySection(label: string, text: string) {
    await copyText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  function copyFromProject(field: keyof PortfolioCaseStudy, value: string) {
    const currentDraft = draft!
    setDraft({ ...currentDraft, [field]: value })
  }

  return (
    <div className="page stack">
      <PageHeader
        title={draft.title}
        subtitle="Case study builder"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Portfolio', to: '/portfolio' }, { label: draft.title }]} />}
        actions={
          <div className="row-wrap">
            {copied ? <Badge tone="success">Copied {copied}</Badge> : null}
            <Button onClick={generateTemplates}>Generate templates</Button>
            <Button variant="primary" onClick={() => void save()}>
              Save case study
            </Button>
          </div>
        }
      />

      <Panel title="Project source">
        <div className="stack">
          <Field label="Select project">
            <Select
              value={draft.projectId ?? ''}
              onChange={(e) => setDraft({ ...draft, projectId: e.target.value || null })}
            >
              <option value="">No project</option>
              {context.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>
          </Field>
          {selectedProject ? (
            <div className="row-wrap">
              <Button size="sm" onClick={() => copyFromProject('title', selectedProject.title)}>
                Copy title
              </Button>
              <Button
                size="sm"
                onClick={() => copyFromProject('businessProblem', selectedProject.originalRequest)}
              >
                Copy problem
              </Button>
              <Button size="sm" onClick={() => copyFromProject('tools', selectedProject.toolsUsed.join(', '))}>
                Copy tools
              </Button>
              <Button
                size="sm"
                onClick={() => copyFromProject('dataCleaning', selectedProject.cleaningLog)}
              >
                Copy cleaning
              </Button>
              <Button size="sm" onClick={() => copyFromProject('analysis', selectedProject.calculations)}>
                Copy analysis
              </Button>
              <Button
                size="sm"
                onClick={() => copyFromProject('keyFindings', selectedProject.keyInsights)}
              >
                Copy findings
              </Button>
              <Button
                size="sm"
                onClick={() => copyFromProject('recommendations', selectedProject.recommendations)}
              >
                Copy recommendations
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Case study fields">
        <div className="grid-2">
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="One sentence summary">
            <Input
              value={draft.oneSentenceSummary}
              onChange={(e) => setDraft({ ...draft, oneSentenceSummary: e.target.value })}
            />
          </Field>
          <Field label="Business problem">
            <Textarea
              value={draft.businessProblem}
              onChange={(e) => setDraft({ ...draft, businessProblem: e.target.value })}
            />
          </Field>
          <Field label="Dataset">
            <Textarea value={draft.dataset} onChange={(e) => setDraft({ ...draft, dataset: e.target.value })} />
          </Field>
          <Field label="Tools">
            <Input value={draft.tools} onChange={(e) => setDraft({ ...draft, tools: e.target.value })} />
          </Field>
          <Field label="Process">
            <Textarea value={draft.process} onChange={(e) => setDraft({ ...draft, process: e.target.value })} />
          </Field>
          <Field label="Data cleaning">
            <Textarea
              value={draft.dataCleaning}
              onChange={(e) => setDraft({ ...draft, dataCleaning: e.target.value })}
            />
          </Field>
          <Field label="Analysis">
            <Textarea value={draft.analysis} onChange={(e) => setDraft({ ...draft, analysis: e.target.value })} />
          </Field>
          <Field label="Dashboard">
            <Textarea value={draft.dashboard} onChange={(e) => setDraft({ ...draft, dashboard: e.target.value })} />
          </Field>
          <Field label="Key findings">
            <Textarea
              value={draft.keyFindings}
              onChange={(e) => setDraft({ ...draft, keyFindings: e.target.value })}
            />
          </Field>
          <Field label="Recommendations">
            <Textarea
              value={draft.recommendations}
              onChange={(e) => setDraft({ ...draft, recommendations: e.target.value })}
            />
          </Field>
          <Field label="Challenges">
            <Textarea value={draft.challenges} onChange={(e) => setDraft({ ...draft, challenges: e.target.value })} />
          </Field>
          <Field label="Lessons learned">
            <Textarea
              value={draft.lessonsLearned}
              onChange={(e) => setDraft({ ...draft, lessonsLearned: e.target.value })}
            />
          </Field>
          <Field label="Links">
            <Textarea value={draft.links} onChange={(e) => setDraft({ ...draft, links: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Resume source fields">
        <div className="grid-2">
          <Field label="Action">
            <Input
              value={draft.resumeAction}
              onChange={(e) => setDraft({ ...draft, resumeAction: e.target.value })}
              placeholder="Analyzed, Built, Designed..."
            />
          </Field>
          <Field label="Method">
            <Input value={draft.resumeMethod} onChange={(e) => setDraft({ ...draft, resumeMethod: e.target.value })} />
          </Field>
          <Field label="Scope">
            <Input value={draft.resumeScope} onChange={(e) => setDraft({ ...draft, resumeScope: e.target.value })} />
          </Field>
          <Field label="Result">
            <Input value={draft.resumeResult} onChange={(e) => setDraft({ ...draft, resumeResult: e.target.value })} />
          </Field>
          <Field label="Impact">
            <Input value={draft.resumeImpact} onChange={(e) => setDraft({ ...draft, resumeImpact: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Generated copy"
        action={
          <Button
            onClick={() =>
              downloadText(`${slugify(draft.title || 'case-study')}.md`, allMarkdown(draft), 'text/markdown')
            }
          >
            Export markdown
          </Button>
        }
      >
        <div className="grid-2">
          {GENERATED_SECTIONS.map(({ label, field }) => {
            const key = field
            const value = String(draft[key] ?? '')
            return (
              <div key={field} className="stack">
                <div className="row-wrap">
                  <h3 className="list-item-title">{label}</h3>
                  <Button size="sm" onClick={() => void copySection(label, value)}>
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={value}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  placeholder={`Generate or write ${label.toLowerCase()}`}
                />
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
