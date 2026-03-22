import { Status, Step, Topic } from '../types';
import { getStatusMeta } from './statusUtils';

export const isTopicActOpen = (topic: Topic) => topic.step === 'ACT' && !topic.act?.completedAt;

export const isTopicActCompleted = (topic: Topic) => topic.step === 'ACT' && !!topic.act?.completedAt;

export const getTopicDisplayStep = (topic: Topic): Step => {
    if (topic.step === 'ACT') return 'CHECK';
    if (topic.step === 'CHECK') return 'DO';
    if (topic.step === 'DO') return 'PLAN';
    return 'PLAN';
};

export const getVisibleTopicStatus = (topic: Topic): Status => {
    if (isTopicActOpen(topic) && topic.status === 'Done') {
        const derived = getStatusMeta('', topic.dueDate);
        if (derived.class === 'status-critical') return 'Critical';
        if (derived.class === 'status-warning') return 'Warning';
        return 'Monitoring';
    }

    return topic.status;
};

export const isTopicVisibleInWorkflow = (topic: Topic) =>
    !isTopicActCompleted(topic) && getVisibleTopicStatus(topic) !== 'Done';
