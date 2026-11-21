import type { Meta, StoryObj } from '@storybook/react';
import { FAQAccordion } from './FAQAccordion';
import type { FAQItem } from './FAQAccordion';

const mockFAQs: FAQItem[] = [
  {
    question: 'What is Hamplard?',
    answer: 'Hamplard is an Africa-focused platform for practical skills learning. We provide courses in various practical trades and crafts.',
  },
  {
    question: 'How do I enroll in a course?',
    answer: 'Simply browse our course catalog, select a course you\'re interested in, and click the "Enroll" button. You\'ll have immediate access to all course materials.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with your course. No questions asked.',
  },
  {
    question: 'Do you offer certificates?',
    answer: 'Yes, upon completing a course, you\'ll receive a digital certificate that you can share on your professional profiles.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept USDC payments via Stellar blockchain, making it easy and secure to pay for courses.',
  },
];

const meta = {
  title: 'UI/FAQAccordion',
  component: FAQAccordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    allowMultiple: {
      control: 'boolean',
    },
    defaultOpenIndex: {
      control: { type: 'number', min: -1, max: 4 },
    },
  },
} satisfies Meta<typeof FAQAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleOpen: Story = {
  args: {
    items: mockFAQs,
    allowMultiple: false,
    defaultOpenIndex: 0,
  },
};

export const MultipleOpen: Story = {
  args: {
    items: mockFAQs,
    allowMultiple: true,
    defaultOpenIndex: null,
  },
};

export const AllClosed: Story = {
  args: {
    items: mockFAQs,
    allowMultiple: false,
    defaultOpenIndex: null,
  },
};

export const ShortList: Story = {
  args: {
    items: mockFAQs.slice(0, 3),
    allowMultiple: false,
    defaultOpenIndex: 0,
  },
};
