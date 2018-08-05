import 'bin/knockout-bootstrap-modal';
import {
    CoreManager,
    Fixtures,
    Notifications,
    Utility
} from 'charactersheet/utilities';
import {
    PersistenceService,
    SortService
} from 'charactersheet/services/common';
import {
    PointOfInterest,
    PointOfInterestSection
} from 'charactersheet/models/dm';
import { KeyValuePredicate } from 'charactersheet/services/common/persistence_service_components/persistence_service_predicates';
import ko from 'knockout';
import sectionIcon from 'images/encounters/rune-stone.svg';
import template from './index.html';

export function PointOfInterestSectionViewModel(params) {
    var self = this;

    self.sectionIcon = sectionIcon;
    self.encounter = params.encounter;
    self.encounterId = ko.pureComputed(function() {
        if (!self.encounter()) { return; }
        return self.encounter().uuid();
    });
    self.characterId = ko.observable();

    self.visible = ko.observable();
    self.name = ko.observable();
    self.tagline = ko.observable();

    self.pointsOfInterest = ko.observableArray();
    self.blankPointOfInterest = ko.observable(new PointOfInterest());
    self.openModal = ko.observable(false);
    self.editItemIndex = null;
    self.currentEditItem = ko.observable();
    self.firstElementInModalHasFocus = ko.observable(false);
    self.editFirstModalElementHasFocus = ko.observable(false);
    self.previewTabStatus = ko.observable('active');
    self.editTabStatus = ko.observable('');

    self.sorts = {
        'name asc': { field: 'name', direction: 'asc' },
        'name desc': { field: 'name', direction: 'desc' },
        'description asc': { field: 'description', direction: 'asc' },
        'description desc': { field: 'description', direction: 'desc' }
    };

    self.filter = ko.observable('');
    self.sort = ko.observable(self.sorts['name asc']);

    /* Public Methods */
    self.load = function() {
        Notifications.global.save.add(self.save);
        Notifications.encounters.changed.add(self._dataHasChanged);

        self.encounter.subscribe(function() {
            self._dataHasChanged();
        });
        self._dataHasChanged();
    };

    self.save = function() {
        // TODO: REMOVE
        // var key = CoreManager.activeCore().uuid();
        // var section = PersistenceService.findByPredicates(PointOfInterestSection, [
        //     new KeyValuePredicate('encounterId', self.encounterId()),
        //     new KeyValuePredicate('characterId', key)
        // ])[0];
        // if (!section) {
        //     section = new PointOfInterestSection();
        //     section.encounterId(self.encounterId());
        //     section.characterId(key);
        // }

        // section.name(self.name());
        // section.visible(self.visible());
        // section.save();

        // self.pointsOfInterest().forEach(function(poi, idx, _) {
        //     poi.save();
        // });
    };

    self.delete = function() {
        // TODO: REMOVE
        // var key = CoreManager.activeCore().uuid();
        // var section = PersistenceService.findByPredicates(PointOfInterestSection, [
        //     new KeyValuePredicate('encounterId', self.encounterId()),
        //     new KeyValuePredicate('characterId', key)
        // ])[0];
        // if (section) {
        //     section.delete();
        // }

        // self.pointsOfInterest().forEach(function(poi, idx, _) {
        //     poi.delete();
        // });
    };

    /* UI Methods */

    /**
     * Filters and sorts the weaponss for presentation in a table.
     */
    self.filteredAndSortedPointsOfInterest = ko.computed(function() {
        return SortService.sortAndFilter(self.pointsOfInterest(), self.sort(), null);
    });

    /**
     * Determines whether a column should have an up/down/no arrow for sorting.
     */
    self.sortArrow = function(columnName) {
        return SortService.sortArrow(columnName, self.sort());
    };

    /**
     * Given a column name, determine the current sort type & order.
     */
    self.sortBy = function(columnName) {
        self.sort(SortService.sortForName(self.sort(), columnName, self.sorts));
    };

    self.addPointOfInterest = async function() {
        var poi = self.blankPointOfInterest();
        poi.coreUuid(CoreManager.activeCore().uuid());
        poi.encounterUuid(self.encounterId());
        const pointResponse = await poi.ps.create();
        self.pointsOfInterest.push(pointResponse.object);
        self.blankPointOfInterest(new PointOfInterest());
    };

    self.removePointOfInterest = async function(poi) {
        await poi.ps.delete();
        self.pointsOfInterest.remove(poi);
    };

    self.editPointOfInterest = function(poi) {
        self.editItemIndex = poi.uuid;
        self.currentEditItem(new PointOfInterest());
        self.currentEditItem().importValues(poi.exportValues());
        self.openModal(true);
    };

    self.toggleModal = function() {
        self.openModal(!self.openModal());
    };

    /* Modal Methods */

    self.modalFinishedOpening = function() {
        self.firstElementInModalHasFocus(true);
    };

    self.modalFinishedClosing = async function() {
        self.selectPreviewTab();

        if (self.openModal()) {
            const pointResponse = await self.currentEditItem().ps.save();
            Utility.array.updateElement(self.pointsOfInterest(), pointResponse.object, self.editItemIndex);
        }

        self.openModal(false);
    };

    self.selectPreviewTab = function() {
        self.previewTabStatus('active');
        self.editTabStatus('');
    };

    self.selectEditTab = function() {
        self.editTabStatus('active');
        self.previewTabStatus('');
        self.editFirstModalElementHasFocus(true);
    };

    /* Private Methods */

    self._dataHasChanged = async function() {
        var coreUuid = CoreManager.activeCore().uuid();
        const pointsResponse = await PointOfInterest.ps.list({coreUuid, encounterUuid: self.encounterId()});
        self.pointsOfInterest(pointsResponse.objects);

        var section = self.encounter().sections()[Fixtures.encounter.sections.pointsOfInterest.index];
        self.name(section.name());
        self.visible(section.visible());
        self.tagline(section.tagline());
    };
}

ko.components.register('point-of-interest-section', {
    viewModel: PointOfInterestSectionViewModel,
    template: template
});
