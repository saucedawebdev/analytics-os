import type { BuiltInKnowledgeEntry, Difficulty } from '@/types'
import { SCHEMA_VERSION, BUILTIN_CONTENT_VERSION } from '@/types'
import { builtinEntry } from '@/data/builtin/helpers'

type SqlTopic = {
  id: string
  title: string
  subcategory: string
  difficulty: Difficulty
  syntaxOrFormula: string
  focus: string
  relatedTopicIds: string[]
}

function sqlEntry(topic: SqlTopic): BuiltInKnowledgeEntry {
  const focus = topic.focus

  return {
    ...builtinEntry({
      id: topic.id,
      title: topic.title,
      category: 'SQL',
      subcategory: topic.subcategory,
      difficulty: topic.difficulty,
      summary: `${topic.title} helps analysts ${focus}. It is part of the practical SQL toolkit for turning raw operational data into trustworthy analysis.`,
      whatItDoes: `It shows how to ${focus} using query logic that can be reviewed and reused. The pattern is framed around common analytics tables such as orders, order_items, customers, products, web_events, and calendar_dates.`,
      whyItMatters: `Business metrics depend on applying ${topic.title} at the right grain with the right filters. A small SQL mistake can change revenue, retention, funnel, or customer counts enough to alter a decision.`,
      whenToUse: `Use ${topic.title} when a stakeholder needs to ${focus}. It is most useful after the population, time window, grain, and expected output have been stated clearly.`,
      syntaxOrFormula: topic.syntaxOrFormula,
      businessExample: `In a retail analytics workflow, an analyst can use ${topic.title} to ${focus}. This supports decisions about merchandising, marketing, operations, finance, customer experience, or executive reporting.`,
      workedExample: `Using the SQL syntax shown, adapt the ecommerce tables to ${focus}. Validate the result by checking row counts, sample records, NULL behavior, and totals against a trusted source.`,
      commonMistakes: `A common mistake is using ${topic.title} before confirming table grain, key uniqueness, date boundaries, and metric definitions. Analysts should also watch for unexpected NULLs, duplicate rows, integer division, and filters that silently change the business population.`,
      bestPractices: `Write the query so the business rule behind ${topic.title} is visible in aliases, filters, and comments. Build complex logic step by step, validate intermediate outputs, and keep final fields aligned with dashboard or stakeholder definitions.`,
      relatedTopicIds: topic.relatedTopicIds,
      practicePrompt: `Write a query for an ecommerce store that uses ${topic.title} to ${focus}. Include realistic filters, explain the expected grain, and add one validation check you would run before sharing the result.`,
      interviewQuestion: `How would you use ${topic.title} to ${focus} in a retail analytics project? In your answer, explain the SQL mechanics, the business use case, and the most likely mistake to avoid.`,
    }),
    schemaVersion: SCHEMA_VERSION,
    contentVersion: BUILTIN_CONTENT_VERSION,
  }
}

const sqlTopics: SqlTopic[] = [
  {
    "id": "builtin-sql-select",
    "title": "SELECT",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT customer_id, order_date, total_amount\nFROM orders;",
    "focus": "choose the exact columns and calculations returned for an order analysis",
    "relatedTopicIds": [
      "builtin-sql-from",
      "builtin-sql-aliases"
    ]
  },
  {
    "id": "builtin-sql-from",
    "title": "FROM",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, total_amount\nFROM orders;",
    "focus": "anchor a query to the table or derived table that defines the starting grain",
    "relatedTopicIds": [
      "builtin-sql-select",
      "builtin-sql-fact-tables"
    ]
  },
  {
    "id": "builtin-sql-where",
    "title": "WHERE",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, total_amount\nFROM orders\nWHERE status = 'completed'\n  AND order_date >= DATE '2026-01-01';",
    "focus": "filter rows to the business population before metrics are calculated",
    "relatedTopicIds": [
      "builtin-sql-having",
      "builtin-sql-comparison-operators"
    ]
  },
  {
    "id": "builtin-sql-distinct",
    "title": "DISTINCT",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT DISTINCT customer_id\nFROM orders\nWHERE order_date >= DATE '2026-01-01';",
    "focus": "return unique customer or product combinations without duplicate output rows",
    "relatedTopicIds": [
      "builtin-sql-count",
      "builtin-sql-deduplication"
    ]
  },
  {
    "id": "builtin-sql-order-by",
    "title": "ORDER BY",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT product_id, revenue\nFROM product_sales\nORDER BY revenue DESC, product_id ASC;",
    "focus": "sort result rows so top, bottom, newest, or oldest records are deterministic",
    "relatedTopicIds": [
      "builtin-sql-limit",
      "builtin-sql-row-number"
    ]
  },
  {
    "id": "builtin-sql-limit",
    "title": "LIMIT",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT *\nFROM orders\nORDER BY order_date DESC\nLIMIT 100;",
    "focus": "return a bounded preview or top-N result set without scanning the full output in the UI",
    "relatedTopicIds": [
      "builtin-sql-order-by",
      "builtin-sql-top-products"
    ]
  },
  {
    "id": "builtin-sql-aliases",
    "title": "Aliases",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT o.order_id, o.total_amount AS revenue\nFROM orders AS o;",
    "focus": "rename tables, columns, and calculations so query intent is easier to read",
    "relatedTopicIds": [
      "builtin-sql-select",
      "builtin-sql-joining-more-than-two-tables"
    ]
  },
  {
    "id": "builtin-sql-comments",
    "title": "Comments",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "-- Exclude canceled orders from booked revenue\nSELECT order_id, total_amount\nFROM orders\nWHERE status = 'completed';",
    "focus": "document business rules and assumptions directly beside the SQL that implements them",
    "relatedTopicIds": [
      "builtin-sql-query-execution-order",
      "builtin-sql-where"
    ]
  },
  {
    "id": "builtin-sql-null",
    "title": "NULL",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT customer_id\nFROM customers\nWHERE last_purchase_date IS NULL;",
    "focus": "represent missing, unknown, or not applicable values without confusing them with zero",
    "relatedTopicIds": [
      "builtin-sql-coalesce",
      "builtin-sql-nullif"
    ]
  },
  {
    "id": "builtin-sql-logical-operators",
    "title": "Logical operators",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id\nFROM orders\nWHERE status = 'completed'\n  AND (channel = 'email' OR channel = 'paid_search');",
    "focus": "combine eligibility rules with AND, OR, and NOT for precise business populations",
    "relatedTopicIds": [
      "builtin-sql-where",
      "builtin-sql-comparison-operators"
    ]
  },
  {
    "id": "builtin-sql-comparison-operators",
    "title": "Comparison operators",
    "subcategory": "Foundations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, total_amount\nFROM orders\nWHERE total_amount >= 100\n  AND status <> 'canceled';",
    "focus": "test equality, inequality, thresholds, and date boundaries in row filters",
    "relatedTopicIds": [
      "builtin-sql-between",
      "builtin-sql-cast"
    ]
  },
  {
    "id": "builtin-sql-in",
    "title": "IN",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, region\nFROM orders\nWHERE region IN ('West', 'Central', 'South');",
    "focus": "filter to a defined list of regions, categories, campaign IDs, or customers",
    "relatedTopicIds": [
      "builtin-sql-subqueries-in-where",
      "builtin-sql-logical-operators"
    ]
  },
  {
    "id": "builtin-sql-between",
    "title": "BETWEEN",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, order_date\nFROM orders\nWHERE order_date BETWEEN DATE '2026-01-01' AND DATE '2026-01-31';",
    "focus": "filter inclusive ranges for dates, amounts, scores, or loyalty bands",
    "relatedTopicIds": [
      "builtin-sql-date-functions",
      "builtin-sql-comparison-operators"
    ]
  },
  {
    "id": "builtin-sql-like",
    "title": "LIKE",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT product_id, product_name\nFROM products\nWHERE product_name LIKE '%shirt%';",
    "focus": "match text patterns in names, SKUs, emails, coupon codes, or descriptions",
    "relatedTopicIds": [
      "builtin-sql-string-functions",
      "builtin-sql-case"
    ]
  },
  {
    "id": "builtin-sql-case",
    "title": "CASE",
    "subcategory": "Filtering and Transformation",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_id,\n  CASE\n    WHEN total_amount >= 200 THEN 'high'\n    WHEN total_amount >= 50 THEN 'medium'\n    ELSE 'low'\n  END AS order_value_band\nFROM orders;",
    "focus": "turn business rules into flags, labels, buckets, and conditional calculations",
    "relatedTopicIds": [
      "builtin-sql-conditional-aggregation",
      "builtin-sql-logical-operators"
    ]
  },
  {
    "id": "builtin-sql-coalesce",
    "title": "COALESCE",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT customer_id, COALESCE(phone, email, 'no contact') AS preferred_contact\nFROM customers;",
    "focus": "choose the first available non-NULL value for fallback labels or calculations",
    "relatedTopicIds": [
      "builtin-sql-null",
      "builtin-sql-nullif"
    ]
  },
  {
    "id": "builtin-sql-nullif",
    "title": "NULLIF",
    "subcategory": "Filtering and Transformation",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT product_id, revenue / NULLIF(units_sold, 0) AS avg_unit_price\nFROM product_sales;",
    "focus": "convert unsafe values such as zero denominators into NULL before calculation",
    "relatedTopicIds": [
      "builtin-sql-coalesce",
      "builtin-sql-avg"
    ]
  },
  {
    "id": "builtin-sql-cast",
    "title": "CAST",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT CAST(order_date_text AS DATE) AS order_date\nFROM raw_orders;",
    "focus": "convert text, date, numeric, and boolean values to the types analytics logic needs",
    "relatedTopicIds": [
      "builtin-sql-date-functions",
      "builtin-sql-numeric-functions"
    ]
  },
  {
    "id": "builtin-sql-string-functions",
    "title": "String functions",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT LOWER(TRIM(email)) AS normalized_email, SUBSTRING(sku FROM 1 FOR 3) AS sku_prefix\nFROM customers;",
    "focus": "clean, standardize, extract, and combine text fields for matching and grouping",
    "relatedTopicIds": [
      "builtin-sql-like",
      "builtin-sql-deduplication"
    ]
  },
  {
    "id": "builtin-sql-date-functions",
    "title": "Date functions",
    "subcategory": "Filtering and Transformation",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT DATE_TRUNC('month', order_date) AS order_month, COUNT(*) AS orders\nFROM orders\nGROUP BY DATE_TRUNC('month', order_date);",
    "focus": "convert timestamps into reporting periods and calculate date-based business metrics",
    "relatedTopicIds": [
      "builtin-sql-between",
      "builtin-sql-month-over-month-growth"
    ]
  },
  {
    "id": "builtin-sql-numeric-functions",
    "title": "Numeric functions",
    "subcategory": "Filtering and Transformation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT ROUND(total_amount, 2) AS rounded_revenue, ABS(refund_amount) AS refund_value\nFROM orders;",
    "focus": "round, bucket, and transform numeric measures for financial and operational analysis",
    "relatedTopicIds": [
      "builtin-sql-cast",
      "builtin-sql-avg"
    ]
  },
  {
    "id": "builtin-sql-count",
    "title": "COUNT",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT COUNT(*) AS order_count, COUNT(customer_id) AS orders_with_customer\nFROM orders;",
    "focus": "count rows, non-NULL values, or distinct entities for volumes and denominators",
    "relatedTopicIds": [
      "builtin-sql-distinct",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-sum",
    "title": "SUM",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT SUM(total_amount) AS revenue\nFROM orders\nWHERE status = 'completed';",
    "focus": "add revenue, units, cost, discounts, or balances across the selected rows",
    "relatedTopicIds": [
      "builtin-sql-group-by",
      "builtin-sql-duplicate-rows-after-joins"
    ]
  },
  {
    "id": "builtin-sql-avg",
    "title": "AVG",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT AVG(total_amount) AS average_order_value\nFROM orders\nWHERE status = 'completed';",
    "focus": "calculate mean order value, delivery time, rating, or other average metrics",
    "relatedTopicIds": [
      "builtin-sql-sum",
      "builtin-sql-count"
    ]
  },
  {
    "id": "builtin-sql-min",
    "title": "MIN",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT customer_id, MIN(order_date) AS first_order_date\nFROM orders\nGROUP BY customer_id;",
    "focus": "find earliest dates, lowest values, or first events for cohorts and ranges",
    "relatedTopicIds": [
      "builtin-sql-group-by",
      "builtin-sql-cohort-analysis"
    ]
  },
  {
    "id": "builtin-sql-max",
    "title": "MAX",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT customer_id, MAX(order_date) AS last_order_date\nFROM orders\nGROUP BY customer_id;",
    "focus": "find latest dates, highest values, or most recent activity for lifecycle analysis",
    "relatedTopicIds": [
      "builtin-sql-latest-record-per-customer",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-group-by",
    "title": "GROUP BY",
    "subcategory": "Aggregation",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT channel, SUM(total_amount) AS revenue\nFROM orders\nGROUP BY channel;",
    "focus": "summarize metrics at the dimension grain required by the business question",
    "relatedTopicIds": [
      "builtin-sql-sum",
      "builtin-sql-having"
    ]
  },
  {
    "id": "builtin-sql-having",
    "title": "HAVING",
    "subcategory": "Aggregation",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) >= 3;",
    "focus": "filter grouped results after aggregate metrics have been calculated",
    "relatedTopicIds": [
      "builtin-sql-where",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-conditional-aggregation",
    "title": "Conditional aggregation",
    "subcategory": "Aggregation",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT channel,\n  SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS completed_revenue,\n  COUNT(CASE WHEN status = 'canceled' THEN 1 END) AS canceled_orders\nFROM orders\nGROUP BY channel;",
    "focus": "calculate several segment-specific metrics in one grouped query",
    "relatedTopicIds": [
      "builtin-sql-case",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-inner-join",
    "title": "INNER JOIN",
    "subcategory": "Joins",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT o.order_id, c.email\nFROM orders AS o\nINNER JOIN customers AS c ON o.customer_id = c.customer_id;",
    "focus": "combine only records with matching keys on both joined tables",
    "relatedTopicIds": [
      "builtin-sql-left-join",
      "builtin-sql-join-keys"
    ]
  },
  {
    "id": "builtin-sql-left-join",
    "title": "LEFT JOIN",
    "subcategory": "Joins",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT o.order_id, c.email\nFROM orders AS o\nLEFT JOIN customers AS c ON o.customer_id = c.customer_id;",
    "focus": "preserve every row from the base table while adding optional matched attributes",
    "relatedTopicIds": [
      "builtin-sql-unmatched-records",
      "builtin-sql-join-debugging"
    ]
  },
  {
    "id": "builtin-sql-right-join",
    "title": "RIGHT JOIN",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT o.order_id, c.customer_id\nFROM orders AS o\nRIGHT JOIN customers AS c ON o.customer_id = c.customer_id;",
    "focus": "preserve every row from the right table, often equivalent to rewriting as a LEFT JOIN",
    "relatedTopicIds": [
      "builtin-sql-left-join",
      "builtin-sql-unmatched-records"
    ]
  },
  {
    "id": "builtin-sql-full-outer-join",
    "title": "FULL OUTER JOIN",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT COALESCE(a.customer_id, b.customer_id) AS customer_id, a.email AS crm_email, b.email AS order_email\nFROM crm_customers AS a\nFULL OUTER JOIN order_customers AS b ON a.customer_id = b.customer_id;",
    "focus": "reconcile two sources by keeping matches and unmatched rows from both sides",
    "relatedTopicIds": [
      "builtin-sql-union",
      "builtin-sql-unmatched-records"
    ]
  },
  {
    "id": "builtin-sql-cross-join",
    "title": "CROSS JOIN",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT d.report_date, p.product_id\nFROM calendar_dates AS d\nCROSS JOIN products AS p;",
    "focus": "create every combination of rows for scaffolds, scenarios, or completeness checks",
    "relatedTopicIds": [
      "builtin-sql-gap-detection",
      "builtin-sql-join-debugging"
    ]
  },
  {
    "id": "builtin-sql-self-join",
    "title": "SELF JOIN",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT e.employee_id, e.name, m.name AS manager_name\nFROM employees AS e\nLEFT JOIN employees AS m ON e.manager_id = m.employee_id;",
    "focus": "join a table to itself to compare rows or resolve hierarchies",
    "relatedTopicIds": [
      "builtin-sql-aliases",
      "builtin-sql-join-keys"
    ]
  },
  {
    "id": "builtin-sql-joining-more-than-two-tables",
    "title": "Joining more than two tables",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT o.order_id, c.segment, p.category, oi.quantity\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id\nJOIN order_items AS oi ON o.order_id = oi.order_id\nJOIN products AS p ON oi.product_id = p.product_id;",
    "focus": "combine facts and dimensions from several business domains in one query",
    "relatedTopicIds": [
      "builtin-sql-join-debugging",
      "builtin-sql-duplicate-rows-after-joins"
    ]
  },
  {
    "id": "builtin-sql-join-keys",
    "title": "Join keys",
    "subcategory": "Joins",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT *\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id;",
    "focus": "identify the stable columns that match records between related tables",
    "relatedTopicIds": [
      "builtin-sql-primary-keys",
      "builtin-sql-foreign-keys"
    ]
  },
  {
    "id": "builtin-sql-duplicate-rows-after-joins",
    "title": "Duplicate rows after joins",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT o.order_id, COUNT(*) AS joined_rows\nFROM orders AS o\nJOIN order_items AS oi ON o.order_id = oi.order_id\nGROUP BY o.order_id\nHAVING COUNT(*) > 1;",
    "focus": "detect row multiplication caused by one-to-many or many-to-many joins",
    "relatedTopicIds": [
      "builtin-sql-sum",
      "builtin-sql-join-debugging"
    ]
  },
  {
    "id": "builtin-sql-unmatched-records",
    "title": "Unmatched records",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT o.order_id\nFROM orders AS o\nLEFT JOIN customers AS c ON o.customer_id = c.customer_id\nWHERE c.customer_id IS NULL;",
    "focus": "find base records that do not have expected matches in a related table",
    "relatedTopicIds": [
      "builtin-sql-left-join",
      "builtin-sql-except"
    ]
  },
  {
    "id": "builtin-sql-join-debugging",
    "title": "Join debugging",
    "subcategory": "Joins",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT COUNT(*) AS rows_after_join, COUNT(DISTINCT o.order_id) AS distinct_orders\nFROM orders AS o\nLEFT JOIN order_items AS oi ON o.order_id = oi.order_id;",
    "focus": "validate joins with row counts, distinct counts, unmatched checks, and key profiling",
    "relatedTopicIds": [
      "builtin-sql-joining-more-than-two-tables",
      "builtin-sql-duplicate-rows-after-joins"
    ]
  },
  {
    "id": "builtin-sql-union",
    "title": "UNION",
    "subcategory": "Set Operations",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id FROM online_customers\nUNION\nSELECT customer_id FROM store_customers;",
    "focus": "append comparable result sets while removing duplicate rows",
    "relatedTopicIds": [
      "builtin-sql-union-all",
      "builtin-sql-distinct"
    ]
  },
  {
    "id": "builtin-sql-union-all",
    "title": "UNION ALL",
    "subcategory": "Set Operations",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT order_id, total_amount FROM online_orders\nUNION ALL\nSELECT order_id, total_amount FROM store_orders;",
    "focus": "append comparable result sets while preserving every input row",
    "relatedTopicIds": [
      "builtin-sql-union",
      "builtin-sql-deduplication"
    ]
  },
  {
    "id": "builtin-sql-intersect",
    "title": "INTERSECT",
    "subcategory": "Set Operations",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id FROM email_subscribers\nINTERSECT\nSELECT customer_id FROM purchasers;",
    "focus": "return entities that appear in two independently defined populations",
    "relatedTopicIds": [
      "builtin-sql-inner-join",
      "builtin-sql-except"
    ]
  },
  {
    "id": "builtin-sql-except",
    "title": "EXCEPT",
    "subcategory": "Set Operations",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id FROM customers\nEXCEPT\nSELECT customer_id FROM orders;",
    "focus": "return records from one population that are absent from another",
    "relatedTopicIds": [
      "builtin-sql-unmatched-records",
      "builtin-sql-left-join"
    ]
  },
  {
    "id": "builtin-sql-scalar-subqueries",
    "title": "Scalar subqueries",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_id, total_amount\nFROM orders\nWHERE total_amount > (SELECT AVG(total_amount) FROM orders);",
    "focus": "compare rows to a single calculated benchmark such as average order value",
    "relatedTopicIds": [
      "builtin-sql-avg",
      "builtin-sql-subqueries-in-where"
    ]
  },
  {
    "id": "builtin-sql-correlated-subqueries",
    "title": "Correlated subqueries",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT c.customer_id\nFROM customers AS c\nWHERE EXISTS (\n  SELECT 1\n  FROM orders AS o\n  WHERE o.customer_id = c.customer_id\n    AND o.order_date >= DATE '2026-01-01'\n);",
    "focus": "filter each outer row using an inner query that references that row",
    "relatedTopicIds": [
      "builtin-sql-subqueries-in-where",
      "builtin-sql-query-optimization-basics"
    ]
  },
  {
    "id": "builtin-sql-subqueries-in-where",
    "title": "Subqueries in WHERE",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id\nFROM customers\nWHERE customer_id IN (\n  SELECT customer_id\n  FROM orders\n  WHERE order_date >= DATE '2026-01-01'\n);",
    "focus": "define filter populations dynamically from another query result",
    "relatedTopicIds": [
      "builtin-sql-in",
      "builtin-sql-correlated-subqueries"
    ]
  },
  {
    "id": "builtin-sql-subqueries-in-from",
    "title": "Subqueries in FROM",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, order_count\nFROM (\n  SELECT customer_id, COUNT(*) AS order_count\n  FROM orders\n  GROUP BY customer_id\n) AS customer_orders\nWHERE order_count >= 3;",
    "focus": "build a derived table at one grain and query it in an outer step",
    "relatedTopicIds": [
      "builtin-sql-common-table-expressions",
      "builtin-sql-having"
    ]
  },
  {
    "id": "builtin-sql-common-table-expressions",
    "title": "Common table expressions",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "intermediate",
    "syntaxOrFormula": "WITH monthly_sales AS (\n  SELECT DATE_TRUNC('month', order_date) AS order_month, SUM(total_amount) AS revenue\n  FROM orders\n  GROUP BY DATE_TRUNC('month', order_date)\n)\nSELECT *\nFROM monthly_sales\nORDER BY order_month;",
    "focus": "break complex analytical SQL into named, readable intermediate steps",
    "relatedTopicIds": [
      "builtin-sql-subqueries-in-from",
      "builtin-sql-month-over-month-growth"
    ]
  },
  {
    "id": "builtin-sql-recursive-cte-overview",
    "title": "Recursive CTE overview",
    "subcategory": "Subqueries and CTEs",
    "difficulty": "advanced",
    "syntaxOrFormula": "WITH RECURSIVE org_tree AS (\n  SELECT employee_id, manager_id, 1 AS level\n  FROM employees\n  WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.employee_id, e.manager_id, ot.level + 1\n  FROM employees AS e\n  JOIN org_tree AS ot ON e.manager_id = ot.employee_id\n)\nSELECT * FROM org_tree;",
    "focus": "walk parent-child hierarchies such as categories, managers, or bill-of-materials",
    "relatedTopicIds": [
      "builtin-sql-self-join",
      "builtin-sql-union-all"
    ]
  },
  {
    "id": "builtin-sql-over",
    "title": "OVER",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_id, total_amount, SUM(total_amount) OVER () AS total_revenue\nFROM orders;",
    "focus": "add aggregate or analytic context without collapsing row-level detail",
    "relatedTopicIds": [
      "builtin-sql-percent-of-total",
      "builtin-sql-partition-by"
    ]
  },
  {
    "id": "builtin-sql-partition-by",
    "title": "PARTITION BY",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, order_id, total_amount,\n  SUM(total_amount) OVER (PARTITION BY customer_id) AS customer_revenue\nFROM orders;",
    "focus": "reset a window calculation for each customer, product, region, or segment",
    "relatedTopicIds": [
      "builtin-sql-over",
      "builtin-sql-percent-of-total"
    ]
  },
  {
    "id": "builtin-sql-window-order-by",
    "title": "ORDER BY in windows",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, order_date, total_amount,\n  SUM(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_customer_revenue\nFROM orders;",
    "focus": "define sequence for cumulative sums, rankings, lag, lead, and first or last values",
    "relatedTopicIds": [
      "builtin-sql-running-totals",
      "builtin-sql-lag"
    ]
  },
  {
    "id": "builtin-sql-row-number",
    "title": "ROW_NUMBER",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT *\nFROM (\n  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, order_id DESC) AS rn\n  FROM orders AS o\n) AS ranked\nWHERE rn = 1;",
    "focus": "assign one deterministic sequence number per row for deduplication or latest-row selection",
    "relatedTopicIds": [
      "builtin-sql-deduplication",
      "builtin-sql-latest-record-per-customer"
    ]
  },
  {
    "id": "builtin-sql-rank",
    "title": "RANK",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT product_id, revenue, RANK() OVER (ORDER BY revenue DESC) AS revenue_rank\nFROM product_sales;",
    "focus": "rank rows while giving ties the same position and leaving gaps",
    "relatedTopicIds": [
      "builtin-sql-dense-rank",
      "builtin-sql-ranking-pattern"
    ]
  },
  {
    "id": "builtin-sql-dense-rank",
    "title": "DENSE_RANK",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT product_id, revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_revenue_rank\nFROM product_sales;",
    "focus": "rank rows while giving ties the same position without leaving gaps",
    "relatedTopicIds": [
      "builtin-sql-rank",
      "builtin-sql-ranking-pattern"
    ]
  },
  {
    "id": "builtin-sql-lag",
    "title": "LAG",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_month, revenue, LAG(revenue) OVER (ORDER BY order_month) AS prior_month_revenue\nFROM monthly_sales;",
    "focus": "compare the current row with a previous period, event, or state",
    "relatedTopicIds": [
      "builtin-sql-month-over-month-growth",
      "builtin-sql-lead"
    ]
  },
  {
    "id": "builtin-sql-lead",
    "title": "LEAD",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, order_date,\n  LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_date\nFROM orders;",
    "focus": "compare the current row with a later event or next state",
    "relatedTopicIds": [
      "builtin-sql-lag",
      "builtin-sql-repeat-purchases"
    ]
  },
  {
    "id": "builtin-sql-running-totals",
    "title": "Running totals",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_date, revenue,\n  SUM(revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue\nFROM daily_sales;",
    "focus": "accumulate revenue, orders, or balances across an ordered reporting series",
    "relatedTopicIds": [
      "builtin-sql-window-order-by",
      "builtin-sql-running-totals-pattern"
    ]
  },
  {
    "id": "builtin-sql-moving-averages",
    "title": "Moving averages",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_date, revenue,\n  AVG(revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS seven_day_avg_revenue\nFROM daily_sales;",
    "focus": "smooth noisy daily measures with a rolling window of recent observations",
    "relatedTopicIds": [
      "builtin-sql-rolling-averages",
      "builtin-sql-date-functions"
    ]
  },
  {
    "id": "builtin-sql-first-value",
    "title": "FIRST_VALUE",
    "subcategory": "Window Functions",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT customer_id, order_date, total_amount,\n  FIRST_VALUE(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS first_order_amount\nFROM orders;",
    "focus": "carry the first value in an ordered partition onto every row for baseline comparison",
    "relatedTopicIds": [
      "builtin-sql-last-value",
      "builtin-sql-window-order-by"
    ]
  },
  {
    "id": "builtin-sql-last-value",
    "title": "LAST_VALUE",
    "subcategory": "Window Functions",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT customer_id, order_date, total_amount,\n  LAST_VALUE(total_amount) OVER (\n    PARTITION BY customer_id\n    ORDER BY order_date\n    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\n  ) AS latest_order_amount\nFROM orders;",
    "focus": "carry the final value in an ordered partition onto every row for latest-state comparison",
    "relatedTopicIds": [
      "builtin-sql-first-value",
      "builtin-sql-latest-record-per-customer"
    ]
  },
  {
    "id": "builtin-sql-ntile",
    "title": "NTILE",
    "subcategory": "Window Functions",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT customer_id, lifetime_value, NTILE(4) OVER (ORDER BY lifetime_value DESC) AS value_quartile\nFROM customer_value;",
    "focus": "split ordered rows into quartiles, deciles, or other ranked buckets",
    "relatedTopicIds": [
      "builtin-sql-customer-lifetime-value",
      "builtin-sql-ranking-pattern"
    ]
  },
  {
    "id": "builtin-sql-percent-of-total",
    "title": "Percent of total",
    "subcategory": "Window Functions",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT product_category, revenue,\n  revenue / NULLIF(SUM(revenue) OVER (), 0) AS share_of_revenue\nFROM category_sales;",
    "focus": "show each row or group as a share of the overall total",
    "relatedTopicIds": [
      "builtin-sql-over",
      "builtin-sql-nullif"
    ]
  },
  {
    "id": "builtin-sql-views",
    "title": "Views",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "CREATE VIEW monthly_revenue AS\nSELECT DATE_TRUNC('month', order_date) AS order_month, SUM(total_amount) AS revenue\nFROM orders\nGROUP BY DATE_TRUNC('month', order_date);",
    "focus": "package reusable SQL definitions behind a named query object",
    "relatedTopicIds": [
      "builtin-sql-common-table-expressions",
      "builtin-sql-query-optimization-basics"
    ]
  },
  {
    "id": "builtin-sql-temporary-tables",
    "title": "Temporary tables",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "CREATE TEMPORARY TABLE recent_orders AS\nSELECT *\nFROM orders\nWHERE order_date >= CURRENT_DATE - INTERVAL '30 days';",
    "focus": "materialize intermediate results for a session, investigation, or multi-step workflow",
    "relatedTopicIds": [
      "builtin-sql-common-table-expressions",
      "builtin-sql-query-optimization-basics"
    ]
  },
  {
    "id": "builtin-sql-indexes",
    "title": "Indexes",
    "subcategory": "Advanced Concepts",
    "difficulty": "advanced",
    "syntaxOrFormula": "CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);",
    "focus": "speed repeated filters, joins, and ordered lookups on large tables",
    "relatedTopicIds": [
      "builtin-sql-query-optimization-basics",
      "builtin-sql-join-keys"
    ]
  },
  {
    "id": "builtin-sql-transactions",
    "title": "Transactions",
    "subcategory": "Advanced Concepts",
    "difficulty": "advanced",
    "syntaxOrFormula": "BEGIN;\nUPDATE inventory SET quantity = quantity - 1 WHERE product_id = 101;\nINSERT INTO inventory_log (product_id, change_qty) VALUES (101, -1);\nCOMMIT;",
    "focus": "make related database changes succeed or fail as one consistent unit",
    "relatedTopicIds": [
      "builtin-sql-stored-procedures-overview",
      "builtin-sql-data-modeling-basics"
    ]
  },
  {
    "id": "builtin-sql-stored-procedures-overview",
    "title": "Stored procedures overview",
    "subcategory": "Advanced Concepts",
    "difficulty": "advanced",
    "syntaxOrFormula": "CREATE PROCEDURE refresh_daily_sales()\nBEGIN\n  INSERT INTO daily_sales_summary\n  SELECT order_date, SUM(total_amount)\n  FROM orders\n  GROUP BY order_date;\nEND;",
    "focus": "encapsulate recurring database logic in a named routine that can be executed or scheduled",
    "relatedTopicIds": [
      "builtin-sql-transactions",
      "builtin-sql-views"
    ]
  },
  {
    "id": "builtin-sql-query-execution-order",
    "title": "Query execution order",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT channel, SUM(total_amount) AS revenue\nFROM orders\nWHERE status = 'completed'\nGROUP BY channel\nHAVING SUM(total_amount) > 1000\nORDER BY revenue DESC;",
    "focus": "understand the logical order SQL uses to process clauses and expressions",
    "relatedTopicIds": [
      "builtin-sql-where",
      "builtin-sql-having"
    ]
  },
  {
    "id": "builtin-sql-query-optimization-basics",
    "title": "Query optimization basics",
    "subcategory": "Advanced Concepts",
    "difficulty": "advanced",
    "syntaxOrFormula": "EXPLAIN\nSELECT o.order_id, c.segment\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id\nWHERE o.order_date >= DATE '2026-01-01';",
    "focus": "improve query speed and cost after correctness has been validated",
    "relatedTopicIds": [
      "builtin-sql-indexes",
      "builtin-sql-join-debugging"
    ]
  },
  {
    "id": "builtin-sql-data-modeling-basics",
    "title": "Data modeling basics",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "-- orders(order_id, customer_id, order_date, total_amount)\n-- order_items(order_id, product_id, quantity, item_revenue)\n-- products(product_id, category, brand)",
    "focus": "organize tables, keys, measures, and relationships around business entities and events",
    "relatedTopicIds": [
      "builtin-sql-fact-tables",
      "builtin-sql-dimension-tables"
    ]
  },
  {
    "id": "builtin-sql-primary-keys",
    "title": "Primary keys",
    "subcategory": "Advanced Concepts",
    "difficulty": "beginner",
    "syntaxOrFormula": "CREATE TABLE customers (\n  customer_id BIGINT PRIMARY KEY,\n  email TEXT\n);",
    "focus": "identify each row uniquely at the table grain",
    "relatedTopicIds": [
      "builtin-sql-join-keys",
      "builtin-sql-foreign-keys"
    ]
  },
  {
    "id": "builtin-sql-foreign-keys",
    "title": "Foreign keys",
    "subcategory": "Advanced Concepts",
    "difficulty": "beginner",
    "syntaxOrFormula": "CREATE TABLE orders (\n  order_id BIGINT PRIMARY KEY,\n  customer_id BIGINT REFERENCES customers(customer_id)\n);",
    "focus": "link fact rows to related dimension or parent rows through referenced keys",
    "relatedTopicIds": [
      "builtin-sql-primary-keys",
      "builtin-sql-unmatched-records"
    ]
  },
  {
    "id": "builtin-sql-normalization",
    "title": "Normalization",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "-- customers(customer_id, email, segment)\n-- orders(order_id, customer_id, order_date)\n-- order_items(order_id, product_id, quantity)",
    "focus": "reduce redundancy by separating entities and attributes into related tables",
    "relatedTopicIds": [
      "builtin-sql-star-schemas",
      "builtin-sql-data-modeling-basics"
    ]
  },
  {
    "id": "builtin-sql-star-schemas",
    "title": "Star schemas",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT d.month, p.category, SUM(f.revenue) AS revenue\nFROM fact_sales AS f\nJOIN dim_date AS d ON f.date_key = d.date_key\nJOIN dim_product AS p ON f.product_key = p.product_key\nGROUP BY d.month, p.category;",
    "focus": "model analytics around central fact tables connected to descriptive dimensions",
    "relatedTopicIds": [
      "builtin-sql-fact-tables",
      "builtin-sql-dimension-tables"
    ]
  },
  {
    "id": "builtin-sql-fact-tables",
    "title": "Fact tables",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT date_key, product_key, customer_key, SUM(revenue) AS revenue\nFROM fact_sales\nGROUP BY date_key, product_key, customer_key;",
    "focus": "store measurable events or snapshots such as orders, sales, inventory, or sessions",
    "relatedTopicIds": [
      "builtin-sql-star-schemas",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-dimension-tables",
    "title": "Dimension tables",
    "subcategory": "Advanced Concepts",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT p.category, SUM(f.revenue) AS revenue\nFROM fact_sales AS f\nJOIN dim_product AS p ON f.product_key = p.product_key\nGROUP BY p.category;",
    "focus": "store descriptive attributes used to filter, group, and label facts",
    "relatedTopicIds": [
      "builtin-sql-star-schemas",
      "builtin-sql-join-keys"
    ]
  },
  {
    "id": "builtin-sql-top-products",
    "title": "Top products",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT p.product_id, p.product_name, SUM(oi.item_revenue) AS revenue\nFROM order_items AS oi\nJOIN products AS p ON oi.product_id = p.product_id\nGROUP BY p.product_id, p.product_name\nORDER BY revenue DESC\nLIMIT 10;",
    "focus": "rank products by revenue, units, margin, or another decision-ready measure",
    "relatedTopicIds": [
      "builtin-sql-order-by",
      "builtin-sql-limit"
    ]
  },
  {
    "id": "builtin-sql-month-over-month-growth",
    "title": "Month-over-month growth",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "WITH monthly_sales AS (\n  SELECT DATE_TRUNC('month', order_date) AS order_month, SUM(total_amount) AS revenue\n  FROM orders\n  GROUP BY DATE_TRUNC('month', order_date)\n)\nSELECT order_month, revenue,\n  (revenue - LAG(revenue) OVER (ORDER BY order_month)) / NULLIF(LAG(revenue) OVER (ORDER BY order_month), 0) AS mom_growth\nFROM monthly_sales;",
    "focus": "compare each month with the immediately previous month",
    "relatedTopicIds": [
      "builtin-sql-lag",
      "builtin-sql-date-functions"
    ]
  },
  {
    "id": "builtin-sql-year-over-year-growth",
    "title": "Year-over-year growth",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "WITH monthly_sales AS (\n  SELECT DATE_TRUNC('month', order_date) AS order_month, SUM(total_amount) AS revenue\n  FROM orders\n  GROUP BY DATE_TRUNC('month', order_date)\n)\nSELECT curr.order_month, curr.revenue, prev.revenue AS prior_year_revenue,\n  (curr.revenue - prev.revenue) / NULLIF(prev.revenue, 0) AS yoy_growth\nFROM monthly_sales AS curr\nLEFT JOIN monthly_sales AS prev ON curr.order_month = prev.order_month + INTERVAL '1 year';",
    "focus": "compare a period with the same period in the previous year to control for seasonality",
    "relatedTopicIds": [
      "builtin-sql-date-functions",
      "builtin-sql-self-join"
    ]
  },
  {
    "id": "builtin-sql-customer-churn",
    "title": "Customer churn",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, MAX(order_date) AS last_order_date\nFROM orders\nGROUP BY customer_id\nHAVING MAX(order_date) < CURRENT_DATE - INTERVAL '90 days';",
    "focus": "identify customers whose last activity is older than the agreed inactivity threshold",
    "relatedTopicIds": [
      "builtin-sql-max",
      "builtin-sql-retention"
    ]
  },
  {
    "id": "builtin-sql-retention",
    "title": "Retention",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "WITH first_orders AS (\n  SELECT customer_id, MIN(order_date) AS first_order_date\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT COUNT(DISTINCT f.customer_id) AS cohort_customers, COUNT(DISTINCT o.customer_id) AS retained_customers\nFROM first_orders AS f\nLEFT JOIN orders AS o ON f.customer_id = o.customer_id\n  AND o.order_date >= f.first_order_date + INTERVAL '30 days';",
    "focus": "measure whether customers return or stay active after a starting event",
    "relatedTopicIds": [
      "builtin-sql-cohort-analysis",
      "builtin-sql-repeat-purchases"
    ]
  },
  {
    "id": "builtin-sql-cohort-analysis",
    "title": "Cohort analysis",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "advanced",
    "syntaxOrFormula": "WITH cohorts AS (\n  SELECT customer_id, DATE_TRUNC('month', MIN(order_date)) AS cohort_month\n  FROM orders\n  GROUP BY customer_id\n), activity AS (\n  SELECT customer_id, DATE_TRUNC('month', order_date) AS activity_month\n  FROM orders\n  GROUP BY customer_id, DATE_TRUNC('month', order_date)\n)\nSELECT cohort_month, activity_month, COUNT(DISTINCT a.customer_id) AS active_customers\nFROM cohorts AS c\nJOIN activity AS a ON c.customer_id = a.customer_id\nGROUP BY cohort_month, activity_month;",
    "focus": "track behavior over time for customers grouped by first purchase or signup period",
    "relatedTopicIds": [
      "builtin-sql-min",
      "builtin-sql-retention"
    ]
  },
  {
    "id": "builtin-sql-funnel-analysis",
    "title": "Funnel analysis",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT\n  COUNT(DISTINCT CASE WHEN event_name = 'product_view' THEN session_id END) AS viewed,\n  COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN session_id END) AS added_to_cart,\n  COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN session_id END) AS purchased\nFROM web_events\nWHERE event_time >= DATE '2026-01-01';",
    "focus": "measure progression and drop-off through ordered customer journey steps",
    "relatedTopicIds": [
      "builtin-sql-conditional-aggregation",
      "builtin-sql-lead"
    ]
  },
  {
    "id": "builtin-sql-marketing-attribution",
    "title": "Marketing attribution",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "advanced",
    "syntaxOrFormula": "WITH touches AS (\n  SELECT customer_id, campaign_id, touch_time,\n    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY touch_time DESC) AS touch_rank\n  FROM marketing_touches\n)\nSELECT o.order_id, t.campaign_id\nFROM orders AS o\nLEFT JOIN touches AS t ON o.customer_id = t.customer_id\n  AND t.touch_time <= o.order_date\n  AND t.touch_rank = 1;",
    "focus": "connect conversions or revenue to campaign touches under an explicit attribution model",
    "relatedTopicIds": [
      "builtin-sql-row-number",
      "builtin-sql-lag"
    ]
  },
  {
    "id": "builtin-sql-customer-lifetime-value",
    "title": "Customer lifetime value",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT customer_id, SUM(total_amount) AS lifetime_revenue, SUM(total_amount - cost_amount) AS lifetime_margin\nFROM orders\nWHERE status = 'completed'\nGROUP BY customer_id;",
    "focus": "summarize historical or modeled customer value for segmentation and investment decisions",
    "relatedTopicIds": [
      "builtin-sql-sum",
      "builtin-sql-ntile"
    ]
  },
  {
    "id": "builtin-sql-repeat-purchases",
    "title": "Repeat purchases",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT customer_id, COUNT(DISTINCT order_id) AS purchase_count\nFROM orders\nWHERE status = 'completed'\nGROUP BY customer_id\nHAVING COUNT(DISTINCT order_id) >= 2;",
    "focus": "identify customers who have completed more than one purchase",
    "relatedTopicIds": [
      "builtin-sql-count",
      "builtin-sql-retention"
    ]
  },
  {
    "id": "builtin-sql-revenue-by-segment",
    "title": "Revenue by segment",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "beginner",
    "syntaxOrFormula": "SELECT c.segment, SUM(o.total_amount) AS revenue\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.segment;",
    "focus": "summarize revenue by customer, product, channel, region, or loyalty segment",
    "relatedTopicIds": [
      "builtin-sql-inner-join",
      "builtin-sql-sum"
    ]
  },
  {
    "id": "builtin-sql-running-totals-pattern",
    "title": "Running totals (pattern)",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_date, daily_revenue,\n  SUM(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue\nFROM daily_sales;",
    "focus": "build cumulative period metrics for pacing, targets, and progress reporting",
    "relatedTopicIds": [
      "builtin-sql-running-totals",
      "builtin-sql-group-by"
    ]
  },
  {
    "id": "builtin-sql-ranking-pattern",
    "title": "Ranking (pattern)",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT *\nFROM (\n  SELECT product_id, category, revenue,\n    RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS category_rank\n  FROM product_sales\n) AS ranked\nWHERE category_rank <= 5;",
    "focus": "rank entities within the whole population or within business segments",
    "relatedTopicIds": [
      "builtin-sql-row-number",
      "builtin-sql-rank"
    ]
  },
  {
    "id": "builtin-sql-deduplication",
    "title": "Deduplication",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT *\nFROM (\n  SELECT c.*, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY updated_at DESC, customer_id DESC) AS rn\n  FROM customers AS c\n) AS ranked\nWHERE rn = 1;",
    "focus": "keep one preferred record from duplicate customers, products, or events",
    "relatedTopicIds": [
      "builtin-sql-row-number",
      "builtin-sql-string-functions"
    ]
  },
  {
    "id": "builtin-sql-latest-record-per-customer",
    "title": "Latest record per customer",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT *\nFROM (\n  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, order_id DESC) AS rn\n  FROM orders AS o\n) AS ranked\nWHERE rn = 1;",
    "focus": "return the full most recent row for each customer or entity",
    "relatedTopicIds": [
      "builtin-sql-row-number",
      "builtin-sql-max"
    ]
  },
  {
    "id": "builtin-sql-gap-detection",
    "title": "Gap detection",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "advanced",
    "syntaxOrFormula": "SELECT d.calendar_date\nFROM calendar_dates AS d\nLEFT JOIN daily_sales AS s ON d.calendar_date = s.order_date\nWHERE s.order_date IS NULL;",
    "focus": "find missing expected dates, sequence numbers, categories, or snapshots",
    "relatedTopicIds": [
      "builtin-sql-cross-join",
      "builtin-sql-left-join"
    ]
  },
  {
    "id": "builtin-sql-rolling-averages",
    "title": "Rolling averages",
    "subcategory": "Common Analytical Patterns",
    "difficulty": "intermediate",
    "syntaxOrFormula": "SELECT order_date, daily_orders,\n  AVG(daily_orders) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7_day_orders\nFROM daily_order_counts;",
    "focus": "smooth volatile daily metrics over a moving window",
    "relatedTopicIds": [
      "builtin-sql-moving-averages",
      "builtin-sql-date-functions"
    ]
  }
]

export const builtinSqlEntries: BuiltInKnowledgeEntry[] = sqlTopics.map(sqlEntry)
