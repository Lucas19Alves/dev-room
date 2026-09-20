import { markRaw } from "vue";
import GenericExperience from "../components/experience/GenericExperience.vue";
import JobExperience from "../components/experience/JobExperience.vue";
import StudyExperience from "../components/experience/StudyExperience.vue";
import ProjectExperience from "../components/experience/ProjectExperience.vue";
import CollegeExperience from "../components/experience/CollegeExperience.vue";
import WeekExperience from "../components/experience/WeekExperience.vue";
import SkillExperience from "../components/experience/SkillExperience.vue";
import ContentExperience from "../components/experience/ContentExperience.vue";
import DynamicExperience from "../components/experience/DynamicExperience.vue";

const raw = (component) => markRaw(component);

/**
 * The registry is the boundary between a Flow definition and its visual
 * experience. Definitions remain data; experiences remain composition.
 */
export const experienceRegistry = Object.freeze({
  declarative: raw(DynamicExperience),
  job: raw(JobExperience),
  enem: raw(StudyExperience),
  contest: raw(StudyExperience),
  code: raw(ProjectExperience),
  college: raw(CollegeExperience),
  week: raw(WeekExperience),
  skill: raw(SkillExperience),
  content: raw(ContentExperience),
  project: raw(ProjectExperience),
  blank: raw(GenericExperience),
  party: raw(GenericExperience),
  language: raw(GenericExperience),
  office: raw(GenericExperience),
});

export function getExperienceComponent(flow) {
  if (flow?.definitionRef?.source === "official") {
    const official = experienceRegistry[flow.definitionRef.id];
    if (official) return official;
  }
  if (flow?.experience?.layout && flow?.protocol?.entities)
    return experienceRegistry.declarative;
  return (
    experienceRegistry[flow?.definitionRef?.id] || experienceRegistry.blank
  );
}

export function experienceKind(flow) {
  const id = flow?.definitionRef?.id;
  return experienceRegistry[id] ? id : "generic";
}
