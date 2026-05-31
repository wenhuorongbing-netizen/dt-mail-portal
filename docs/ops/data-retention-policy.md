# Data Retention Policy

## Principle
Keep the minimum operational record needed to understand order progress. Do not store sensitive personal or payment data.

## Allowed Skeleton Data
- Internal order reference
- Current status
- Non-sensitive platform name
- Non-sensitive event identifier
- Consent confirmation timestamp
- Operator initials or identifier
- High-level notes that do not reveal private customer data

## Disallowed Data
- Passwords
- Payment card or bank details
- CVV or one-time codes
- Identity documents
- Full customer address records
- Private account recovery information
- Raw customer message dumps containing sensitive information

## Closure
When an order reaches `closed`, retain only the minimum non-sensitive status trail unless a later approved policy requires otherwise.
