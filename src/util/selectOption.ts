import { default as UserModel } from "../models/User";

export interface SelectOption {
    label: string;
    value: string;
    isDefault?: boolean;
    isSelected?: boolean;
}

// Credit Transfer Target User Account
export async function OPTIONS_CREDIT_TRANSFER_TARGET(currentUserId: String) {
    const result = [] as SelectOption[];
    const list = await UserModel.find({ "_id": { $ne: currentUserId } }).sort({ "profile.name": 1 });
    if (list && list.length > 0) {
        list.forEach(user => {
            const option = {
                label: user.profile.name + " (Balance: " + user.creditBalance + ")",
                value: user._id.toString() // always convert to string for value comparison of type ObjectId
            };
            result.push(option);
        });
    }
    return result;
}

export function markSelectedOption(selectedValue: string, options: SelectOption[]) {
    if (selectedValue && options) {
        const option = options.find(option => option.value === selectedValue);
        if (option) {
            option.isSelected = true;
        }
    }
}

export function markSelectedOptions(selectedValues: string[], options: SelectOption[]) {
    if (selectedValues && options) {
        options.forEach(option => {
            if (selectedValues.indexOf(option.value) > -1) {
                option.isSelected = true;
            }
        });
    }
}

export function getLabelByValue(value: string, options: SelectOption[]) {
    let result: string;
    if (options) {
        const option = options.find(option => option.value === value);
        if (option) {
            result = option.label;
        }
    }
    return result;
}

export function getLabelsByValues(values: string[], options: SelectOption[]) {
    const result: string[] = [];
    if (options) {
        values.forEach((value) => {
            const label = getLabelByValue(value, options);
            if (label) {
                result.push(label);
            }
        });
    }
    return result;
}

export function getFlattenedLabelsByValues(values: string[], options: SelectOption[]) {
    let result = "";
    if (values) {
        const labels = this.getLabelsByValues(values, options) as string[];
        if (labels) {
            labels.forEach((label, i) => {
                if (i == 0)
                    result = label;
                else
                    result += ", " + label;
            });
        }
    }
    return result;
}